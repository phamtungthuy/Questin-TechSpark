import sys
from datasets import Dataset 
import traceback
import argparse
from ragas.metrics import context_precision, faithfulness, answer_relevancy, context_recall
from ragas import evaluate
from dotenv import load_dotenv
import pandas as pd
import json
import os
from copy import deepcopy
from langchain_openai.chat_models import ChatOpenAI
from ragas.llms import LangchainLLMWrapper

load_dotenv()

def calculate_score(file_path):
    # if file_path.endswith(".xlsx"):
    #     dataset = pd.read_excel(file_path, index_col=None, )
    #     if "retrieved_contexts" in dataset.columns:
    #         dataset["retrieved_contexts"] = dataset["retrieved_contexts"].fillna('').astype(str)
    #     if "response" in dataset.columns:
    #         dataset["response"] = dataset["response"].fillna('').astype(str)
    #     if "search_query" in dataset.columns:
    #         dataset["search_query"] = dataset["search_query"].fillna('').astype(str)
    #     if "Unnamed: 0" in dataset.columns:
    #         dataset = dataset.drop(columns=["Unnamed: 0"])
    #     eval_dataset = Dataset.from_dict(dataset)
    #     eval_dataset = eval_dataset.map(lambda x: {"retrieved_contexts": json.loads(x["retrieved_contexts"])})
    # elif file_path.endswith("json"):
    name = file_path.split("/")[-1].split(".")[0]
    with open(file_path, "r", encoding="utf-8") as f:
        dataset = json.loads(f.read())
    model_name = "gpt-4o-mini"
    openai_model = ChatOpenAI(
        model=model_name
    )
    llm = LangchainLLMWrapper(openai_model)
    eval_dataset = {
        "user_input": [],
        "response": [],
        "retrieved_contexts": [],
        "reference": [],
        "time": [],
        "context_precision": [],
        "faithfulness": [],
        "answer_relevancy": [],
        "context_recall": [],
        
    }
    try:
        xlsx_dataset = pd.read_excel(file_path.replace(".json", f"_{model_name}.xlsx"), engine='openpyxl')
        if "retrieved_contexts" in xlsx_dataset.columns:
            xlsx_dataset["retrieved_contexts"] = xlsx_dataset["retrieved_contexts"].fillna('').astype(str)
        if "response" in xlsx_dataset.columns:
            xlsx_dataset["response"] = xlsx_dataset["response"].fillna('').astype(str)
        if "search_query" in xlsx_dataset.columns:
            xlsx_dataset["search_query"] = xlsx_dataset["search_query"].fillna('').astype(str)
        for _, row in xlsx_dataset.iterrows():
            eval_dataset["context_precision"].append(row.get("context_precision", ""))
            eval_dataset["faithfulness"].append(row.get("faithfulness", ""))
            eval_dataset["answer_relevancy"].append(row.get("answer_relevancy", ""))
            eval_dataset["context_recall"].append(row.get("context_recall", ""))
    except Exception as e:
        print(f"An error occurred: {e}")
        
            
    if "total_tokens" in dataset[0]:
        eval_dataset["total_tokens"] = []
    else:
        eval_dataset["total_in_token"] = []
        eval_dataset["total_out_token"] = []
    for item in dataset:
        eval_dataset["user_input"].append(item["user_input"])
        eval_dataset["response"].append(item["response"])
        eval_dataset["retrieved_contexts"].append(item["retrieved_contexts"])
        eval_dataset["reference"].append(item["reference"])
        if len(eval_dataset["context_precision"]) < len(eval_dataset["user_input"]):
            eval_dataset["context_precision"].append("")
        if len(eval_dataset["faithfulness"]) < len(eval_dataset["user_input"]):
            eval_dataset["faithfulness"].append("")
        if len(eval_dataset["answer_relevancy"]) < len(eval_dataset["user_input"]):
            eval_dataset["answer_relevancy"].append("")
        if len(eval_dataset["context_recall"]) < len(eval_dataset["user_input"]):
            eval_dataset["context_recall"].append("")
        if "total_tokens" in item:
            eval_dataset["total_tokens"].append(item["total_tokens"])
        else:
            eval_dataset["total_in_token"].append(item["total_in_token"])
            eval_dataset["total_out_token"].append(item["total_out_token"])
        eval_dataset["time"].append(item["time"])
    dataset = deepcopy(eval_dataset)
    # del dataset["response"]
    dataset = pd.DataFrame(dataset)
    try:
        dataset.to_excel(file_path.replace(".json", f"_{model_name}.xlsx"), engine='openpyxl', index=False)
    except:
        dataset.to_excel(f"./{name}_{model_name}.xlsx", engine='openpyxl', index=False)
    eval_dataset = Dataset.from_dict(eval_dataset)
    metrics = [
        "context_precision",
        "faithfulness",
        "answer_relevancy",
        "context_recall"
    ]
    ragas_metric = []
    for metric in metrics:
        if metric == "context_precision":
            ragas_metric.append(context_precision)
        elif metric == "faithfulness":
            ragas_metric.append(faithfulness)
        elif metric == "answer_relevancy":
            ragas_metric.append(answer_relevancy)
        elif metric == "context_recall":
            ragas_metric.append(context_recall)
    score = evaluate(eval_dataset, metrics=ragas_metric, llm=llm)
    for metric in metrics:
        dataset[metric] = score[metric]

    try:
        dataset.to_excel(file_path.replace(".json", f"_{model_name}.xlsx"), engine='openpyxl', index=False)
    except:
        dataset.to_excel(f"./{name}_{model_name}.xlsx", engine='openpyxl', index=False)
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--file-path', type=str, help='Path to the file')

    if len(sys.argv) < 1:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()
    try:
        calculate_score(args.file_path)
    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)
        