import sys
import re
import argparse
import traceback
import requests
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import context_precision, faithfulness, answer_relevancy, context_recall
from dotenv import load_dotenv
import uuid

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
            
def run_test(dataset_file, output_file, chat_url, conversation_id, authorization):
    dataset = load_dataset_file(dataset_file)
    save_output_file(output_file, dataset)
    for idx, question in enumerate(dataset["user_input"]):
        body = {
            "conversation_id": conversation_id,
            "stream": False,
            "messages": [
                {
                    "id": str(uuid.uuid1().hex),
                    "role": "user",
                    "content": question
                },
                {
                    "id": str(uuid.uuid1().hex),
                    "role": "assistant",
                    "content": ""
                }
            ]
        }
        response = requests.post(chat_url,
                                 json=body,
                                 headers={
                                     "Content-Type": "application/json",
                                     "Authorization": f"Bearer {authorization}"
                                 })
        response = response.json()
        print(idx, response["data"]["answer"])
        dataset["response"][idx] = response["data"]["answer"]
        dataset["retrieved_contexts"][idx] = [chunk["content_with_weight"] for chunk in response["data"]["reference"]["chunks"]]
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
    parser.add_argument("--conversation-id", default=False, type=str, help="Id of conversation")
    parser.add_argument("--chat-url", default=False, type=str, help="Questin chat url")
    authorization = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY1ZmEyMWYyYTdkZjExZWZhMDVlMDI0MmFjMTQwMDA2IiwiY3JlYXRlX3RpbWUiOjE3MzIxNzY1ODIwMzEsImNyZWF0ZV9kYXRlIjoiMjAyNC0xMS0yMVQwODowOTo0MiIsInVwZGF0ZV90aW1lIjoxNzMzNjQ3MTY0MjIyLCJ1cGRhdGVfZGF0ZSI6IjIwMjQtMTItMDhUMDg6Mzk6MjQiLCJhY2Nlc3NfdG9rZW4iOiJlZDY1ZjgxNGI1M2YxMWVmYjM3NDAyNDJhYzE0MDAwOCIsIm5pY2tuYW1lIjoiYWRtaW4iLCJwYXNzd29yZCI6IiQyYiQxMiRUdmxYZzNMSFhvQXdEVWY3RVlETWV1SGFSN0FSYkZ3Y0tyMlE5TEdrVEtNY3ZQL2tNazRaSyIsImVtYWlsIjoiYWRtaW5AcXVlc3Rpbi5pbyIsImF2YXRhciI6bnVsbCwibGFuZ3VhZ2UiOiJWaWV0bmFtZXNlIiwiY29sb3Jfc2NoZW1hIjoiQnJpZ2h0IiwidGltZXpvbmUiOiJVVEMrN1x0QXNpYS9Ib19DaGlfTWluaCIsImxhc3RfbG9naW5fdGltZSI6bnVsbCwiaXNfYXV0aGVudGljYXRlZCI6IjEiLCJpc19hY3RpdmUiOiIxIiwiaXNfYW5vbnltb3VzIjoiMCIsImxvZ2luX2NoYW5uZWwiOm51bGwsInN0YXR1cyI6IjEiLCJpc19zdXBlcnVzZXIiOnRydWUsImV4cCI6MTczNDQwMjMxMH0.L49zLoypcu8nuhm9pJpfnODiOoTzuD9eqCpMANAlD8g"
    if len(sys.argv) < 5:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()
    try:
        run_test(args.dataset_file, args.output_file, 
                 args.chat_url, args.conversation_id, 
                 authorization)
    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)
        