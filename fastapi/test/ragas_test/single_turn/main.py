import sys
from datasets import Dataset 
import traceback
import argparse
from ragas.metrics import context_precision, faithfulness, answer_relevancy, context_recall
from ragas import evaluate
from dotenv import load_dotenv
import pandas as pd
from copy import deepcopy
import json
from langchain_openai.chat_models import ChatOpenAI
from ragas.llms import LangchainLLMWrapper
import os
load_dotenv()

def calculate_score(file_path, row_index):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.loads(f.read())
    user_input = data[row_index]["user_input"]
    response = data[row_index]["response"]
    retrieved_contexts = data[row_index]["retrieved_contexts"]
    reference = data[row_index]["reference"]
    model_name = "gpt-4o-mini"
    openai_model = ChatOpenAI(
        model=model_name
    )
    llm = LangchainLLMWrapper(openai_model)
    dataset = Dataset.from_dict({
        "user_input": [user_input],
        "response": [response],
        "retrieved_contexts": [retrieved_contexts],
        "reference": [reference]
    })
    print(user_input, len(retrieved_contexts))
    score = evaluate(dataset, metrics=[
        context_precision,
        faithfulness,
        answer_relevancy,
        context_recall
        ], llm=llm)
    print(score)
    
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--file-path', type=str, help='Path to the file')
    parser.add_argument('--row-index', type=int, help='Row index'), 
    if len(sys.argv) < 2:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()
    try:
        calculate_score(args.file_path, args.row_index)
    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)