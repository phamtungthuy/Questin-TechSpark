import sys
import re
import argparse
import glob
import os
import traceback
from math import ceil
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.llms import OpenAI
from langchain_community.docstore.document import Document
from openai import OpenAI
from ragas import evaluate
from ragas.metrics import context_precision, faithfulness, answer_relevancy, context_recall
from datasets import Dataset 
from my_embedding import MyEmbeddings
from txt_parser import QuestinTxtParser as TxtParser
from pdf_parser import MetricParser as PdfParser
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
load_dotenv()

def load_dataset_file(dataset_file):
    dataset = {
        "user_input": [],
        "response": [],
        "retrieved_contexts": [],
        "reference": []
    }
    if re.match(r".*\.(xlsx|csv)$", dataset_file):
        import pandas as pd
        if re.match(r".*\.(xlsx)$", dataset_file):
            df = pd.read_excel(dataset_file)
        else:
            df = pd.read_csv(dataset_file)
        dataset["user_input"] = df["Question"].to_list()
        dataset["reference"] = df["Ground Truth"].to_list()
    dataset["response"] = ["" for i in range(len(dataset["user_input"]))]
    dataset["retrieved_contexts"] = [[] for i in range(len(dataset["user_input"]))]
        
    return dataset

def save_output_file(output_file, data):
    data["retrieved_contexts"] = ["\n\n\n".join(context) for context in data["retrieved_contexts"]]
    
    if re.match(r".*\.(xlsx|csv)$", output_file):
        import pandas as pd
        df = pd.DataFrame(data)
        if output_file.endswith(".csv"):
            df.to_csv(output_file, index=True)
        else:
            df.to_excel(output_file, index=True)

def load_context_files(context_path, context_data_type="pdf"):
    paths = glob.glob(f"%s/%s" % (context_path, f"*.{context_data_type}"))
    docs = []
    if context_data_type == "pdf":
        from langchain_community.document_loaders import PyPDFLoader
        parser = PdfParser()
        for path in paths:
            cks = parser(path)
            for ck in cks:
                docs.append(Document(page_content=ck))
    elif context_data_type == "txt":
        from langchain_community.document_loaders import TextLoader
        parser =TxtParser()
        for path in paths:
            cks = parser(path)
            for ck in cks:
                docs.append(Document(page_content=ck))
            # loader = TextLoader(path, encoding="utf-8")
            # docs.extend(loader.load_and_split())
    return docs


# Hàm để thêm tài liệu với chia nhỏ batch


def run_test(dataset_file, output_file, context_path, context_data_type):
    # embed_model = OpenAIEmbeddings(model="text-embedding-3-small")
    embed_model = MyEmbeddings(api_key=os.getenv("OPENAI_API_KEY"), base_url="http://localhost:8000", model_name="keepitreal/vietnamese-sbert")
    dataset = load_dataset_file(dataset_file)
    docs = load_context_files(context_path, context_data_type)
    print(len(docs))
    if len(docs) == 0:
        print("No documents")
        sys.exit(1)
    save_output_file(output_file, dataset)
    bm25_retriever = BM25Retriever.from_documents(docs)
    bm25_retriever.k = 3
    index_name = output_file.split("/")[-1].split(".")[0]
    vectorstore = Chroma(persist_directory=f"{index_name}",embedding_function=embed_model)
    batch_size = 4000
    num_batches = ceil(len(docs) / batch_size)
    for i in range(num_batches):
        start = i * batch_size
        end = start + batch_size
        vectorstore.add_documents(docs[start:end])
    chroma_retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    retriever = EnsembleRetriever(
        retrievers=[bm25_retriever, chroma_retriever], weights=[0.3, 0.7]
    )
    client = OpenAI()
    prompt = """Bạn là một trợ lý thông minh, hãy tóm tắt nội dung của kho kiến thức để trả lời câu hỏi, vui lòng liệt kê dữ liệu trong kho kiến thức để trả lời chi tiết. Khi tất cả nội dung của kho kiến thức đều không liên quan đến câu hỏi, câu trả lời của bạn phải bao gồm câu “Không tìm thấy câu trả lời mà bạn muốn trong kho kiến thức!”. Câu trả lời cần cân nhắc đến lịch sử trò chuyện.
    Dưới đây là kho kiến thức:
    {knowledge}
    Đây là kho kiến thức.
    
    ### Câu hỏi:\n{question}"""
    for idx, quetion in enumerate(dataset["user_input"]):
        cks = retriever.invoke(quetion)
        print(idx, len(cks))
        dataset["retrieved_contexts"][idx] = [ck.page_content for ck in cks]
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt.format(
                knowledge="\n\n\n".join([ck.page_content for ck in cks]),
                question=quetion
            )}]
        )
        print( response.choices[0].message.content.strip())
        dataset["response"][idx] = response.choices[0].message.content.strip()
    eval_dataset = Dataset.from_dict(dataset)
    save_output_file(output_file, dataset)
    score = evaluate(eval_dataset, metrics=[
        context_precision,
        faithfulness,
        answer_relevancy,
        context_recall
    ])
    dataset["context_precision"] = score["context_precision"]
    dataset["faithfulness"] = score["faithfulness"]
    dataset["answer_relevancy"] = score["answer_relevancy"]
    dataset["context_recall"] = score["context_recall"]
    save_output_file(output_file, dataset)
    
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-file", default=False, type=str, help="Path to input file")
    parser.add_argument("--output-file", default=False, type=str, help="Path to output file")
    parser.add_argument("--context-path", default=False, type=str, help="Path to context file")
    parser.add_argument("--context-data-type", default=False, type=str, help="Type of context data")
    
    if len(sys.argv) < 5:
        parser.print_help()
        sys.exit(1)

    
    args = parser.parse_args()
    try:
        run_test(args.dataset_file, args.output_file, args.context_path, args.context_data_type)
    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)