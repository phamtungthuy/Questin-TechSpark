import sys
import re
import argparse
import glob
import traceback
from dotenv import load_dotenv
from openai import OpenAI
from ragas import evaluate
from ragas.metrics import context_precision, faithfulness, answer_relevancy, context_recall
from datasets import Dataset
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.core import Settings
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
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
    docs = []
    if context_data_type == "pdf":
        docs = SimpleDirectoryReader(input_dir=context_path, required_exts=[".pdf"]).load_data()
    if context_data_type == "txt":
        docs = SimpleDirectoryReader(input_dir=context_path, required_exts=[".txt"]).load_data()
    return docs

def run_test(dataset_file, output_file, context_path, context_data_type):
    # embed_model = OpenAIEmbedding(model="text-embedding-3-small")
    embed_model = HuggingFaceEmbedding(model_name="keepitreal/vietnamese-sbert")
    Settings.embed_model = embed_model
    dataset = load_dataset_file(dataset_file)
    docs = load_context_files(context_path, context_data_type)
    print(len(docs))
    if len(docs) == 0:
        print("No documents")
        sys.exit(1)
    save_output_file(output_file, dataset)
    vectorstore = VectorStoreIndex.from_documents(docs)
    retriever = vectorstore.as_retriever()
    client = OpenAI()
    prompt = """Bạn là một trợ lý thông minh, hãy tóm tắt nội dung của kho kiến thức để trả lời câu hỏi, vui lòng liệt kê dữ liệu trong kho kiến thức để trả lời chi tiết. Khi tất cả nội dung của kho kiến thức đều không liên quan đến câu hỏi, câu trả lời của bạn phải bao gồm câu “Không tìm thấy câu trả lời mà bạn muốn trong kho kiến thức!”. Câu trả lời cần cân nhắc đến lịch sử trò chuyện.
    Dưới đây là kho kiến thức:
    {knowledge}
    Đây là kho kiến thức.
    
    ### Câu hỏi:\n{question}"""
    for idx, quetion in enumerate(dataset["user_input"]):
        cks = retriever.retrieve(quetion)
        dataset["retrieved_contexts"][idx] = [ck.text for ck in cks]
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt.format(
                knowledge="\n\n\n".join([ck.text for ck in cks]),
                question=quetion
            )}]
        )
        dataset["response"][idx] = response.choices[0].message.content.strip()
        print(response.choices[0].message.content.strip())
        print("---------------------------")
    eval_dataset = Dataset.from_dict(dataset)
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