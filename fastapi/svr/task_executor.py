import os
import json
import sys
import time
from functools import partial
from timeit import default_timer as timer
import re
import traceback
import copy
import hashlib
import datetime
from io import BytesIO

from elasticsearch_dsl import Q
import numpy as np
import pandas as pd
from db.db_services.task_service import TaskService
from db.db_services.llm_service import LLMBundle
from db.db_services.file2document_service import File2DocumentService
from db.db_services.document_service import DocumentService
from db.constants import LLMType, ParserType
from db.settings import retrievaler
from services.settings import SVR_QUEUE_NAME, cron_logger, DOC_MAXIMUM_SIZE
from services.deepdoc.domain_parser import naive, table, gso, qa, knowledge_graph
from services.conn.redis_conn import REDIS_CONN, Payload
from services.conn.storage_factory import STORAGE_IMPL
from services.conn.es_conn import ELASTICSEARCH
from services.service_utils import rmSpace, num_tokens_from_string
from services.nlp import search, rag_tokenizer
from utils.file_utils import get_project_base_directory
from db.conn import close_connection
from concurrent.futures import ThreadPoolExecutor
from services.rag.raptor.raptor import RecursiveAbstractiveProcessing4TreeOrganizedRetrieval as Raptor

FACTORY = {
    "general": naive,
    ParserType.NAIVE.value: naive,
    ParserType.TABLE.value: table,
    ParserType.GSO.value: gso,
    ParserType.QA.value: qa,
    ParserType.KG.value: knowledge_graph
}

CONSUMER_NAME = "task_consumer_" + ("0" if len(sys.argv) < 2 else sys.argv[1])
PAYLOAD: Payload | None = None

def set_progress(task_id, from_page=0, to_page=-1, prog=None, msg="Processing..."):
    """
    Update the progress of a task with a given message and progress value.
    Parameters:
    task_id (str): The unique identifier of the task.
    from_page (int, optional): The starting page number for the progress update. Defaults to 0.
    to_page (int, optional): The ending page number for the progress update. Defaults to -1.
    prog (int, optional): The progress value to be set. If None, progress is not updated. Defaults to None.
    msg (str, optional): The message to be associated with the progress update. Defaults to "Processing...".
    Returns:
    None
    Raises:
    Exception: If there is an error while updating the task progress.
    Notes:
    - If `prog` is provided and is less than 0, the message will be prefixed with "[ERROR]".
    - If the task is canceled, the message will be appended with " [Canceled]" and `prog` will be set to -1.
    - If `to_page` is greater than 0, the message will include the page range.
    """
    global PAYLOAD
    if prog is not None and prog < 0:
        msg = "[ERROR]" + msg
    cancel = TaskService.do_cancel(task_id)
    if cancel:
        msg += " [Canceled]"
        prog = -1
    
    if to_page > 0:
        if msg:
            msg = f"Page({from_page + 1}~{to_page + 1}): " + msg
    d = {"progress_msg": msg}
    if prog is not None:
        d["progress"] = prog
    try:
        TaskService.update_progress(task_id, d)
    except Exception as e:
        cron_logger.error("set_progresss:({}), {}".format(task_id, str(e)))

    close_connection()
    if cancel:
        if PAYLOAD:
            PAYLOAD.ack()
            PAYLOAD = None
        os._exit(0)

def collect():
    """
    Collects tasks from a Redis queue and processes them.
    This function attempts to retrieve unacknowledged tasks for a specific consumer from a Redis queue.
    If no unacknowledged tasks are found, it retrieves new tasks from the queue. If no tasks are available,
    it waits for a short period before returning an empty DataFrame.
    Returns:
        pd.DataFrame: A DataFrame containing the tasks if available, otherwise an empty DataFrame.
    Raises:
        Exception: If there is an error while fetching tasks from the Redis queue.
    Notes:
        - If a task has been canceled, it logs the cancellation and returns an empty DataFrame.
        - If no tasks are found for a given message ID, it logs a warning and returns an empty list.
        - If the task type is "raptor", it adds a "task_type" column with the value "raptor" to the DataFrame.
    """
    global CONSUMER_NAME, PAYLOAD
    try:
        PAYLOAD = REDIS_CONN.get_unacked_for(CONSUMER_NAME, SVR_QUEUE_NAME, "questin_svr_task_broker")
        if not PAYLOAD:
            PAYLOAD = REDIS_CONN.queue_consumer(SVR_QUEUE_NAME, "questin_svr_task_broker", CONSUMER_NAME)
        if not PAYLOAD:
            time.sleep(1)
            return pd.DataFrame()
    except Exception as e:
        cron_logger.error("Get task event from queue exception:" + str(e))
        return pd.DataFrame()
    
    msg = PAYLOAD.get_message()
    if not msg:
        return pd.DataFrame()
    
    if TaskService.do_cancel(msg["id"]):
        cron_logger.info("Task {} has been canceled".format(msg["id"]))
        return pd.DataFrame()
    tasks = TaskService.get_tasks(msg["id"])
    if not tasks:
        cron_logger.warning("{} empty task!".format(msg["id"]))
        return []
    
    tasks = pd.DataFrame(tasks)
    if msg.get("type", "") == "raptor":
        tasks["task_type"] = "raptor"
    return tasks

def get_storage_binary(bucket, name):
    return STORAGE_IMPL.get(bucket, name)

def build(row):
    if row["size"] > DOC_MAXIMUM_SIZE:
        set_progress(row["id"], prog=-1, msg="File size exceeds( <= %dMb)" % 
                     (int(DOC_MAXIMUM_SIZE / 1024 / 1024)))
        return []
    callback = partial(
        set_progress,
        row["id"],
        row["from_page"],
        row["to_page"]
    )
    chunker = FACTORY[row["parser_id"].lower()]
    try:
        st = timer()
        bucket, name = File2DocumentService.get_storage_address(doc_id=row["doc_id"])
        binary = get_storage_binary(bucket, name)
        cron_logger.info(
            "From minio({}) {}/{}".format(timer() - st, row["location"], row["name"])
        )
    except TimeoutError:
        callback(-1, "Internal server error: Fetch file from minio timeout. Could you try it again.")
        cron_logger.error(
            "Minio {}/{}: Fetch file from minio timeout.".format(row["location"], row["name"])
        )
        return
    except Exception as e:
        if re.search("(No such file|not found)", str(e)):
            callback(-1, "Can not find file <%s> from minio. Could you try it again?" % row["name"])
        else:
            callback(-1, "Get file from minio: %s" % str(e).replace("'", ""))
        traceback.print_exc()
        return
    
    try:
        cks = chunker.chunk(row["name"], binary=binary, from_page=row["from_page"],
                            to_page=row["to_page"], lang=row["language"], callback=callback,
                            kb_id=row["kb_id"], parser_config=row["parser_config"], tenant_id=row["tenant_id"])
        cron_logger.info(
            "Chunking({}) {}/{}".format(timer() - st, row["location"], row["name"])
        )
    except Exception as e:
        callback(-1, "Internal server error while chunking: %s" %
                     str(e).replace("'", ""))
        cron_logger.error(
            "Chunking {}/{}: {}".format(row["location"], row["name"], str(e)))
        traceback.print_exc()
        return
    docs = []
    doc = {
        "doc_id": row["doc_id"],
        "kb_id": [str(row["kb_id"])]
    }
    el = 0
    for ck in cks:
        d = copy.deepcopy(doc)
        d.update(ck)
        md5 = hashlib.md5()
        md5.update((ck["content_with_weight"] + 
                    str(d["doc_id"])).encode("utf-8"))
        d["_id"] = md5.hexdigest()
        d["create_time"] = str(datetime.datetime.now()).replace("T", " ")[:19]
        d["create_timestamp_flt"] = datetime.datetime.now().timestamp()
        if not d.get("image"):
            docs.append(d)
            continue
        
        try:
            output_buffer = BytesIO()
            if isinstance(d["image"], bytes):
                output_buffer = BytesIO(d["image"])
            else:
                d["image"].save(output_buffer, format="JPEG")
                
            st = timer()
            STORAGE_IMPL.put(row["kb_id"], d["_id"], output_buffer.getvalue())
            el += timer() - st
        except Exception as e:
            cron_logger.error(str(e))
            traceback.print_exc()

        d["img_id"] = "{}-{}".format(row["kb_id"], d["_id"])
        del d["image"]
        docs.append(d)
        
    cron_logger.info("MINIO PUT({}):{}".format(row["name"], el))
    
    return docs
        
def init_kb(row):
    idxnm = search.index_name(row["tenant_id"])
    if ELASTICSEARCH.indexExist(idxnm):
        return
    return ELASTICSEARCH.createIdx(idxnm, json.load(
        open(os.path.join(get_project_base_directory(), "conf", "mapping.json"), "r")))

        
def embedding(docs, mdl, parser_config=None, callback=None):
    """
    Embeds the given documents using the provided model and parser configuration.
    Args:
        docs (list): A list of dictionaries, where each dictionary represents a document.
        mdl (object): The model used for encoding the documents.
        parser_config (dict, optional): Configuration for the parser. Defaults to None.
        callback (function, optional): A callback function to report progress. Defaults to None.
    Returns:
        int: The total token count processed.
    Raises:
        AssertionError: If the length of the resulting vectors does not match the length of the documents.
    """
    if parser_config is None:
        parser_config = {}
    batch_size = 32
    tts, cnts = [rmSpace(d["title_tks"]) for d in docs if d.get("title_tks")], [
        re.sub(r"</?(table|td|caption|tr|th)( [^<>]{0,12})?>", " ", d["content_with_weight"]) for d in docs]
    tk_count = 0
    if len(tts) == len(cnts):
        tts_ = np.array([])
        for i in range(0, len(tts), batch_size):
            vts, c = mdl.encode(tts[i: i + batch_size])
            if len(tts_) == 0:
                tts_ = vts
            else:
                tts_ = np.concatenate((tts_, vts), axis=0)
            tk_count += c
            callback(prog=0.6 + 0.1 * (i + 1) / len(tts), msg="")
        tts = tts_

    cnts_ = np.array([])
    for i in range(0, len(cnts), batch_size):
        vts, c = mdl.encode(cnts[i: i + batch_size])
        if len(cnts_) == 0:
            cnts_ = vts
        else:
            cnts_ = np.concatenate((cnts_, vts), axis=0)
        tk_count += c
        callback(prog=0.7 + 0.2 * (i + 1) / len(cnts), msg="")
    cnts = cnts_

    title_w = float(parser_config.get("filename_embd_weight", 0.1))
    vects = (title_w * tts + (1 - title_w) *
             cnts) if len(tts) == len(cnts) else cnts

    assert len(vects) == len(docs)
    for i, d in enumerate(docs):
        v = vects[i].tolist()
        d["q_%d_vec" % len(v)] = v
    return tk_count

def run_raptor(row, chat_mdl, embd_mdl, callback=None):
    vts, _ = embd_mdl.encode(["ok"])
    vctr_nm = "q_%d_vec" % len(vts[0])
    chunks = []
    for d in retrievaler.chunk_list(row["doc_id"], row["tenant_id"], 
                                    fields=["content_with_weight", vctr_nm]):
        chunks.append((d["content_with_weight"], np.array(d[vctr_nm])))

    raptor = Raptor(
        row["parser_config"]["raptor"].get("max_cluster", 64),
        chat_mdl,
        embd_mdl,
        row["parser_config"]["raptor"]["prompt"],
        row["parser_config"]["raptor"]["max_token"],
        row["parser_config"]["raptor"]["threshold"]
    )
    original_length = len(chunks)
    chunks = raptor(chunks, row["parser_config"]["raptor"]["random_seed"], callback)
    doc = {
        "doc_id": row["doc_id"],
        "kb_id": [str(row["kb_id"])],
        "docnm_kwd": row["name"],
        "title_tks": rag_tokenizer.tokenize(row["name"]),
        "title_kwd": row["name"],
    }
    res = []
    tk_count = 0
    for content, vctr in chunks[original_length:]:
        d = copy.deepcopy(doc)
        md5 = hashlib.md5()
        md5.update((content + str(d["doc_id"])).encode("utf-8"))
        d["_id"] = md5.hexdigest()
        d["create_time"] = str(datetime.datetime.now()).replace("T", " ")[:19]
        d["create_timestamp_flt"] = datetime.datetime.now().timestamp()
        d[vctr_nm] = vctr.tolist()
        d["content_with_weight"] = content
        d["content_ltks"] = rag_tokenizer.tokenize(content)
        d["content_sm_ltks"] = rag_tokenizer.fine_grained_tokenize(d["content_ltks"])
        res.append(d)
        tk_count += num_tokens_from_string(content)
    return res, tk_count
  
def main():
    """
        In here, it will handle background tasks
    """
    rows = collect()
    if len(rows) == 0:
        return
    for _, r in rows.iterrows():
        callback = partial(set_progress, r["id"], r["from_page"], r["to_page"])
        try:
            embd_mdl = LLMBundle(r["tenant_id"], LLMType.EMBEDDING, llm_name=r["embd_id"], lang=r["language"])
        except Exception as e:
            callback(-1, msg=str(e))
            cron_logger.error(str(e))
            continue
        
        if r.get("task_type", "") == "raptor":
            try:
                chat_mdl = LLMBundle(r["tenant_id"], LLMType.CHAT, llm_name=r["llm_id"], lang=r["language"])
                cks, tk_count = run_raptor(r, chat_mdl, embd_mdl, callback)
            except Exception as e:
                callback(-1, msg=str(e))
                cron_logger.error(str(e))
                continue
        
        else:
            st = timer()
            cks = build(r)
            cron_logger.info("Build chunks({}): {}".format(r["name"], timer() - st))
            if cks is None:
                continue
            if not cks:
                callback(-1, msg="No chunks! Done!")
                continue
            callback(
                msg="Finished slicing files(%d). Start to embedding the content." %
                    len(cks))
            st = timer()
            try:
                tk_count = embedding(cks, embd_mdl, r["parser_config"], callback)
            except Exception as e:
                callback(-1, "Embedding error:{}".format(str(e)))
                cron_logger.error(str(e))
                tk_count = 0
            cron_logger.info("Embedding elapsed({}): {:.2f}".format(r["name"], timer() - st))
            callback(msg="Finished embedding({:.2f})! Start to build index!".format(timer() - st))
        init_kb(r)
        chunk_count = len(set([c["_id"] for c in cks]))
        st = timer()
        es_r = ""
        es_bulk_size = 4
        for b in range(0, len(cks), es_bulk_size):
            es_r = ELASTICSEARCH.bulk(cks[b:b + es_bulk_size], search.index_name(r["tenant_id"]))
            if b % 128 == 0:
                callback(prog=0.8 + 0.1 * (b + 1) / len(cks), msg="")

        cron_logger.info("Indexing elapsed({}): {:.2f}".format(r["name"], timer() - st))
        if es_r:
            callback(-1, "Insert chunk error, detail info please check questin-logs/api/cron_logger.log. Please also check ES status!")
            ELASTICSEARCH.deleteByQuery(
                Q("match", doc_id=r["doc_id"]), idxnm=search.index_name(r["tenant_id"]))
            cron_logger.error(str(es_r))
        else:
            if TaskService.do_cancel(r["id"]):
                ELASTICSEARCH.deleteByQuery(
                    Q("match", doc_id=r["doc_id"]), idxnm=search.index_name(r["tenant_id"]))
                continue
            callback(1., "Done!")
            DocumentService.increment_chunk_num(
                r["doc_id"], r["kb_id"], tk_count, chunk_count, 0)
            cron_logger.info(
                "Chunk doc({}), token({}), chunks({}), elapsed:{:.2f}".format(
                    r["id"], tk_count, len(cks), timer() - st))

def report_status():
    global CONSUMER_NAME
    while True:
        try:
            obj = REDIS_CONN.get("TASKEXE")
            if not obj: obj = {}
            else: obj = json.loads(obj)
            if CONSUMER_NAME not in obj: obj[CONSUMER_NAME] = []
            obj[CONSUMER_NAME].append(timer())
            obj[CONSUMER_NAME] = obj[CONSUMER_NAME][-60:]
            REDIS_CONN.set_obj("TASKEXE", obj, 60*2)
        except Exception as e:
            print("[Exception]:", str(e))
        time.sleep(30)

if __name__ == "__main__":

    exe = ThreadPoolExecutor(max_workers=1)
    exe.submit(report_status)

    while True:
        main()
        if PAYLOAD:
            PAYLOAD.ack()
            PAYLOAD = None