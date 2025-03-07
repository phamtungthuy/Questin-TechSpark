import sys
from datasets import Dataset 
import traceback
import argparse
from ragas.metrics import context_precision, faithfulness, answer_relevancy, context_recall
from ragas import evaluate
from dotenv import load_dotenv
import pandas as pd
from copy import deepcopy

load_dotenv()

def calculate_score(file_path, start_index, end_index):
    df = pd.read_excel(file_path)
    for row_index in range(start_index, end_index + 1):
        row = deepcopy(df.iloc[row_index])
        data_samples = {
            "user_input": [row["user_input"]],
            "response": [row["response"]],
            "retrieved_contexts": [row["retrieved_contexts"].split("\n\n\n")],
            "reference": [row["reference"]],
        }
        print(row_index, data_samples["user_input"])
        dataset = Dataset.from_dict(data_samples)
        score = evaluate(dataset, metrics=[context_precision,
            faithfulness,
            answer_relevancy,
            context_recall
            ])
        print(score)
        
        df.at[row_index, "context_precision"] = score["context_precision"]
        df.at[row_index, "faithfulness"] = score["faithfulness"]
        df.at[row_index, "answer_relevancy"] = score["answer_relevancy"]
        df.at[row_index, "context_recall"] = score["context_recall"]
    df.to_excel(file_path, index=False)
    
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--file-path', type=str, help='Path to the file')
    parser.add_argument('--start-index', type=int, help='Start index') 
    parser.add_argument('--end-index', type=int, help='End index') 
    if len(sys.argv) < 3:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()
    try:
        calculate_score(args.file_path, args.start_index, args.end_index)
    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)