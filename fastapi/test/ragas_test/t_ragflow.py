import sys
import re
import argparse
import traceback
import requests
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import context_precision, faithfulness, answer_relevancy, context_recall
from dotenv import load_dotenv


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
                    "role": "user",
                    "content": question
                }
            ]
        }
        response = requests.post(chat_url,
                                 json=body,
                                 headers={
                                     "Content-Type": "application/json",
                                     "Authorization": authorization
                                 })
        response = response.json()
        print(question)
        print(response["data"]["answer"])
        print("-----------------------------")
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
    parser.add_argument("--authorization", default=False, type=str, help="Authorization key")
    parser.add_argument("--conversation-id", default=False, type=str, help="Id of conversation")
    parser.add_argument("--chat-url", default=False, type=str, help="Ragflow chat url")
    if len(sys.argv) < 6:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()
    try:
        run_test(args.dataset_file, args.output_file, 
                 args.chat_url, args.conversation_id, 
                 args.authorization)
    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)