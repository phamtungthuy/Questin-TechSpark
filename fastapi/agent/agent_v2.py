from db.db_services.llm_service import LLMBundle, TenantLLMService
from db.constants import LLMType, ParserType
from openai import OpenAI
import openai
from textwrap import dedent
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.db_services.dialog_service import DialogService
from pydantic import BaseModel
from db.settings import retrievaler
import json
import threading
from copy import deepcopy
from datetime import datetime
from agent.agent_utils import contact_info

class Parameters(BaseModel):
    pass

class RetrievalParameters(BaseModel):
    query: str


def decorate_answer(answer, kbinfos, embd_mdl, vector_similarity_weight):
    answer, idx = retrievaler.insert_citations(answer, [ck["content_ltks"] for ck in kbinfos["chunks"]],
                                                [ck["vector"] for ck in kbinfos["chunks"]],
                                                embd_mdl=embd_mdl,
                                                tkweight=1 - vector_similarity_weight,
                                                vtweight=vector_similarity_weight)
    idx = set([kbinfos["chunks"][int(i)]["doc_id"] for i in idx])
    recall_docs = [d for d in kbinfos["doc_aggs"] if d["doc_id"] in idx]
    if not recall_docs:
        recall_docs = kbinfos["doc_aggs"]
    kbinfos["doc_aggs"] = recall_docs
    refs = deepcopy(kbinfos)
    for c in refs["chunks"]:
        if c.get("vector"):
            del c["vector"]
    if answer.lower().find("invalid key") >= 0 or answer.lower().find("invalid api") >= 0:
        answer += " Please set LLM API-Key in 'User Setting -> Model Providers -> API-Key'"
    return {"answer": answer, "reference": refs}      

def rerank_results(query, ranks, dialog, top_n=4, rerank_mdl=None):
    if not ranks["chunks"]:
        return ranks
    if not rerank_mdl:
        sim, tsim, vsim = retrievaler.manual_rerank(dialog.id, [ck["content_with_weight"] for ck in ranks["chunks"]], query)
    else:
        sim, tsim, vsim = retrievaler.manual_rerank_by_model(rerank_mdl, [ck["content_with_weight"] for ck in ranks["chunks"]], query,
                                                                 1 - dialog.vector_similarity_weight, dialog.vector_similarity_weight)

    chunks = [chunk for _, chunk in sorted(zip(sim, [ck for ck in ranks["chunks"]]), key=lambda pair: pair[0], reverse=True)]
    ranks["chunks"] = chunks[:top_n]
    for ck in ranks["chunks"]:
        dnm = ck["docnm_kwd"]
        did = ck["doc_id"]
        if dnm not in ranks["doc_aggs"]:
            ranks["doc_aggs"][dnm] = {"doc_id": did, "count": 0}
        ranks["doc_aggs"][dnm]["count"] += 1
    ranks["doc_aggs"] = [{"doc_name": k,
                            "doc_id": v["doc_id"],
                            "count": v["count"]} for k,
                            v in sorted(ranks["doc_aggs"].items(),
                                    key=lambda x:x[1]["count"] * -1)]
    return ranks

def merged_results(ranks_1, ranks_2):
    chunks = ranks_1["chunks"] + ranks_2["chunks"]
    ranks = {"total": ranks_1["total"] + ranks_2["total"], "chunks": chunks, "doc_aggs": {}}
    for ck in chunks:
        dnm = ck["docnm_kwd"]
        did = ck["doc_id"]
        if dnm not in ranks["doc_aggs"]:
            ranks["doc_aggs"][dnm] = {"doc_id": did, "count": 0}
        ranks["doc_aggs"][dnm]["count"] += 1
    ranks["doc_aggs"] = [{"doc_name": k,
                            "doc_id": v["doc_id"],
                            "count": v["count"]} for k,
                            v in sorted(ranks["doc_aggs"].items(),
                                    key=lambda x:x[1]["count"] * -1)]
    return ranks

def decorate_answer(answer, kbinfos, embd_mdl, vector_similarity_weight):
    answer, idx = retrievaler.insert_citations(answer, [ck["content_ltks"] for ck in kbinfos["chunks"]],
                                                [ck["vector"] for ck in kbinfos["chunks"]],
                                                embd_mdl=embd_mdl,
                                                tkweight=1 - vector_similarity_weight,
                                                vtweight=vector_similarity_weight)
    idx = set([kbinfos["chunks"][int(i)]["doc_id"] for i in idx])
    recall_docs = [d for d in kbinfos["doc_aggs"] if d["doc_id"] in idx]
    if not recall_docs:
        recall_docs = kbinfos["doc_aggs"]
    kbinfos["doc_aggs"] = recall_docs
    refs = deepcopy(kbinfos)
    for c in refs["chunks"]:
        if c.get("vector"):
            del c["vector"]
    if answer.lower().find("invalid key") >= 0 or answer.lower().find("invalid api") >= 0:
        answer += " Please set LLM API-Key in 'User Setting -> Model Providers -> API-Key'"
    return {"answer": answer, "reference": refs}        

class AgentWorkFlow:
    def __init__(self, dialog):
        model_config = TenantLLMService.get_api_key(dialog.tenant_id, dialog.llm_id)
        if model_config:
            model_config = model_config.to_dict()
        else:
            raise ValueError("No model config found")
        self.chat_mdl = OpenAI(api_key=model_config["api_key"],
                                     base_url=model_config["api_base"])
        self.rerank_mdl = None
        self.chat_mdl_name = model_config["llm_name"]
        if dialog.rerank_id:
            self.rerank_mdl = LLMBundle(dialog.tenant_id, LLMType.RERANK, dialog.rerank_id)
        self.kbs = KnowledgebaseService.get_by_ids(dialog.kb_ids)
        self.dialog= dialog
        embd_nms = list(set([kb.embd_id for kb in self.kbs]))
        if len(embd_nms) != 1:
            raise ValueError("The number of embd_nms is not 1")
        self.embd_mdl = LLMBundle(dialog.tenant_id, LLMType.EMBEDDING, embd_nms[0])
        self.tools = {
            "next": openai.pydantic_function_tool(Parameters, name="next", description="Get next step"),
            "retrieval": openai.pydantic_function_tool(RetrievalParameters, name="retrieval", description="Retrieval knowledge")
        }
        
    def hello(self, query: str):
        system_prompt = """
Bạn là trợ lý ảo chính thức của Trường Đại học Công nghệ - ĐHQGHN. Hãy thực hiện các bước sau:

1. Phân loại câu hỏi:
- Nếu là chào hỏi/xã giao (VD: "Xin chào", "Hello", "Chào buổi sáng"): 
   → Chào lại lịch sự và mời đặt câu hỏi (VD: "Xin chào! Tôi có thể giúp gì cho bạn về thông tin Đại học Công nghệ?")
- Nếu là câu hỏi chuyên môn/trường học hoặc những câu hỏi tối nghĩa khác: 
   → Gọi tool "next" để chuyển sang giai đoạn phân tích

2. Nguyên tắc:
- Giữ phản hồi ngắn gọn (<2 câu) với câu xã giao
- Luôn dùng tiếng Việt phổ thông
- Không tự trả lời câu hỏi chuyên môn khi chưa qua tool
- Gợi ý các chủ đề thường gặp nếu cần (tuyển sinh, chương trình đào tạo, học phí)
"""
        response = self.chat_mdl.chat.completions.create(
            model=self.chat_mdl_name,
            messages=[
                {"role": "system", "content": dedent(system_prompt)},
                {"role": "user", "content": query}
            ],
            tools=[self.tools["next"]],
            stream=True
        )
        tools = []
        for chunk in response:
            if chunk.choices[0].delta.tool_calls:
                tool_calls = chunk.choices[0].delta.tool_calls
                if len(tools) == 0:
                    tools = [{"name": tool_call.function.name, "arguments": tool_call.function.arguments} for tool_call in tool_calls]
                else:
                    for idx, tool_call in enumerate(tool_calls):
                        tools[idx]["arguments"] += tool_call.function.arguments
            elif not tools and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
        if tools:
            yield tools
    
    def analyze(self, query: str, history: list[object]):
        time = datetime.now().date()
        system_prompt = """
        
Thời gian hiện tại là: {time}
Bạn là chuyên gia phân tích câu hỏi học thuật. Hãy phân tích câu hỏi theo cấu trúc:

1. Xác định chủ đề chính: 
   - Lĩnh vực (tuyển sinh, đào tạo, nghiên cứu...)
   - Đối tượng được hỏi (sinh viên, thạc sĩ, nghiên cứu sinh)

2. Phân rã thành các yếu tố cần truy xuất:
   - Từ khóa chính (VD: "học phí", "chỉ tiêu", "ngành CNTT")
   - Thông tin bổ trợ (thời gian, địa điểm, điều kiện kèm theo)

3. Tóm tắt truy vấn:
   - Tạo 1-3 truy vấn con ngắn gọn (<15 từ) tập trung vào yếu tố chính
   - Ưu tiên danh từ riêng, thuật ngữ chuyên môn

Ví dụ:
Câu hỏi: "Điều kiện xét tuyển ngành Khoa học Máy tính năm 2024 gồm những gì?"
→ Truy vấn: ["Điều kiện xét tuyển 2024", "Ngành Khoa học Máy tính"]
"""
        response = self.chat_mdl.chat.completions.create(
            model=self.chat_mdl_name,
            messages=[
                *history,
                {"role": "system", "content": dedent(system_prompt.format(time=time))},
                {"role": "user", "content": query}
            ],
    
            stream=True
        )
        for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


    def analyze_tool_call(self, query: str, guidance: str):
        system_prompt = """
Bạn là hệ thống xử lý truy vấn thông minh. Hãy:

1. Phân tích các yếu tố từ phần tư vấn viên:
- Các chủ đề con cần truy xuất
- Từ khóa then chốt và từ đồng nghĩa

2. Tạo truy vấn hiệu quả:
- Tối đa 3 truy vấn/câu hỏi
- Kết hợp từ khóa theo cú pháp: [A] [B] site:uet.vnu.edu.vn 
- Loại bỏ từ không cần thiết (từ hỏi, từ nối)

Ví dụ:
Phân tích: "Thông tin tuyển sinh hệ thạc sĩ 2024"
→ Truy vấn: ["thông tin tuyển sinh thạc sĩ 2024 site:uet.vnu.edu.vn"]

Hướng dẫn từ tư vấn viên:
{guidance}
"""
        response=  self.chat_mdl.chat.completions.create(
            model=self.chat_mdl_name,
            messages=[
                {"role": "system", "content": dedent(system_prompt.format(guidance=guidance))},
                {"role": "user", "content": query}
            ],
            tools=[self.tools["retrieval"]],
            tool_choice="required"
        )
        tool_calls = []
        for tool_call in response.choices[0].message.tool_calls:
            tool_calls.append({"name": tool_call.function.name, "query": json.loads(tool_call.function.arguments)["query"]})
        return tool_calls
        
    def answer(self, query: str, knowledge: str, history):
        system_prompt = """Bạn là chuyên gia tư vấn của Đại học Công nghệ. Hãy trả lời câu hỏi theo các bước:

1. TÓM TẮT TRI THỨC:
- Liệt kê các thông tin liên quan từ nguồn dữ liệu
- Ghi chú các con số, mốc thời gian, điều kiện quan trọng

2. PHÂN TÍCH YÊU CẦU:
- Đối chiếu với từng phần của câu hỏi
- Xác định thông tin đủ/thiếu cần làm rõ

3. TRẢ LỜI:
- Trình bày theo cấu trúc: Giới thiệu → Chi tiết → Kết luận
- Đánh số các điều kiện/yêu cầu quan trọng

QUY TẮC:
- Chỉ sử dụng thông tin từ knowledge base
- Giữ câu trả lời dưới 500 từ
- Dùng ngôn ngữ tự nhiên, không dạng bullet point
- Nếu thiếu thông tin: Yêu cầu làm rõ hoặc cung cấp liên hệ bộ phận chuyên môn

Knowledge base:
{knowledge}
"""

        response = self.chat_mdl.chat.completions.create(
            model=self.chat_mdl_name,
            messages=[
                *history,
                {"role": "system", "content": dedent(system_prompt.format(knowledge=knowledge))},
                {"role": "user", "content": query}
            ],
            stream=True
        )
        for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
                
        yield "\n\n" + contact_info
    
    def retrieval(self, questions: list[object], top_k=None):
        threads = []
        lock = threading.Lock()
        ranks = {"total": 0, "chunks": [], "doc_aggs": {}}
        top_n = top_k if top_k else self.dialog.top_n
        def retrie(query: str, external_source=False):
            kbinfos = retrievaler.retrieval(
                query, self.embd_mdl, self.dialog.tenant_id, self.dialog.kb_ids, 1, top_n,
                self.dialog.similarity_threshold, self.dialog.vector_similarity_weight,
                doc_ids=None, top=self.dialog.top_k, aggs=False, rerank_mdl=None, external_source=external_source
            )
            with lock:
                ranks["total"] += kbinfos["total"]
                for ck in kbinfos["chunks"]:
                    if ck["chunk_id"] not in [c["chunk_id"] for c in ranks["chunks"]]:
                        ranks["chunks"].append(ck)
        for question in questions:
            thread = threading.Thread(target=retrie, args=(question["query"], question["external_source"]))
            threads.append(thread)
            thread.start()
        for thread in threads:
            thread.join()
        return ranks
    
    def _run(self, query: str, history: list[object]):
        tools = []
        ans = ""
        think_msg = ""
        for chunk in self.hello(query):
            if type(chunk) == list:
                tools = chunk
                yield {
                    "state_msg": "🕒 Xin hãy đợi chút, tôi đang phân tích câu hỏi...",
                    "response": {
                        "answer": ans,
                        "reference": {}
                    },
                    "think": think_msg
                }
                break
            ans += chunk
            yield {
                "state_msg": "",
                "response": {
                    "answer": ans,
                    "reference": {}
                },
                "think": think_msg 
            }
        if not tools:
            return
        guidance = ""
        for chunk in self.analyze(query, history):
            guidance += chunk
            think_msg += chunk
            yield {
                "state_msg": "",
                "response": {
                    "answer": ans,
                    "reference": {}
                },
                "think": think_msg
            }
        tools = self.analyze_tool_call(query, guidance)
        if tools:
            yield {
                "state_msg": "📚 Đang tìm kiếm dữ liệu trong kho kiến thức",
                "response": {
                    "answer": "",
                    "reference": {}
                },
                "think": think_msg
            }
            questions = []
            merged_query = query
            for tool in tools:
                if tool["name"] == "retrieval":
                    merged_query += "\n" + tool["query"]
                    questions.append({
                        "query": tool["query"],
                        "external_source": False
                    })
#             yield """Tôi sẽ tìm kiếm những thông tin liên quan đến các câu hỏi sau:
# - {questions}""".format(questions="\n- ".join(questions))
            ranks = self.retrieval(questions)
            external_source_ranks = self.retrieval([{
                "query": query,
                "external_source": False
            }], 6)
            ranks = rerank_results(merged_query, deepcopy(ranks), self.dialog, 10, self.rerank_mdl)
            knowledges = [ck["content_with_weight"] for ck in ranks["chunks"]]
            for chunk in self.answer(query, "\n\n\n".join(knowledges), history):
                ans += chunk
                yield {
                    "state_msg": "",
                    "response": {
                        "answer": ans,
                        "reference": {}
                    },
                    "think": think_msg
                }
            merged_ranks = merged_results(ranks, external_source_ranks)
            answer = decorate_answer(ans, merged_ranks, self.embd_mdl, self.dialog.vector_similarity_weight)
            yield {
                "state_msg": "",
                "response": answer,
                "think": think_msg
            }
            
                
def clean_text(text: str) -> str:
    import unicodedata
    # Cách 1: Normalize về dạng NFKC
    normalized = unicodedata.normalize("NFKC", text)
    # Cách 2: Nếu vẫn có lỗi, bạn có thể thay thế các ký tự không encode được:
    cleaned = normalized.encode("utf-8", "replace").decode("utf-8")
    return cleaned
            
if __name__ == '__main__':
    question = input("Question: ")
    question = clean_text(question)
    dialog_id = "8eff7bbed70a11ef86200242ac120006"
    e, dialog = DialogService.get_by_id(dialog_id)
    if not e:
        raise ValueError("Dialog not found")
    agent = AgentWorkFlow(dialog)
    think = ""
    answer = ""
    history = [
    ]
    for ans in agent._run(question, history):
        if ans["state_msg"]:
            state_msg = ans["state_msg"]
            print(f"\n\n-------------{state_msg}-------------\n\n")
        if ans["response"]["answer"] \
            and answer != ans["response"]["answer"]:
            if not answer:
                next_token = ans["response"]["answer"]
            else: 
                next_token = ans["response"]["answer"].split(answer)[-1]
            answer = ans["response"]["answer"]
            print(next_token, end="")
        if ans["think"] and think != ans["think"]:
            if not think:
                next_token = ans["think"]
            else:
                next_token = ans["think"].split(think)[-1]
            think = ans["think"]
            print(next_token, end="")