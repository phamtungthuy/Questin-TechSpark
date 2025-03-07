import sys
import re
import argparse
import traceback
from agent.manager_agent import ManagerAgent
from agent.agent_v5_eval_light import AgentWorkFlow
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from datasets import Dataset
from db.db_services.dialog_service import DialogService
from dotenv import load_dotenv
import asyncio
import json

load_dotenv()
def load_dataset_file(dataset_file):
    questions = []
    references = []
    if re.match(r".*\.(xlsx|csv)$", dataset_file):
        import pandas as pd
        if re.match(r".*\.(xlsx)$", dataset_file):
            df = pd.read_excel(dataset_file)
        else:
            df = pd.read_csv(dataset_file)
            
        questions = df["Question"].to_list()
        references = df["Ground Truth"].to_list()
        
    return questions, references

def save_output_file(output_file, data):
    
    if re.match(r".*\.(json)$", output_file):
        # import pandas as pd
        # df = pd.DataFrame(data)
        # if output_file.endswith(".csv"):
        #     df.to_csv(output_file, index=True)
        # else:
        #     df.to_excel(output_file, index=True)
        with open(output_file, "w", encoding="utf-8") as file:
            file.write(json.dumps(data, ensure_ascii=False))
            
async def run_test(dataset_file, output_file, dialog_id):
    questions, references = load_dataset_file(dataset_file)
    if len(questions) != len(references):
        raise ValueError("Questions and references must have the same length")
    # model = ChatOpenAI(model="gpt-4o-mini")
    # manager = ManagerAgent(model, [], dialog_id)
    e, dialog = DialogService.get_by_id(dialog_id)
    if not e:
        raise ValueError("Dialog not found")
    
    if not output_file.endswith(".json"):
        raise ValueError("Output file must be a json file")
    try:
        with open(output_file, "r", encoding="utf-8") as file:
            data = json.loads(file.read())
    except:
        data = []
    for idx, question in enumerate(questions):
        if idx < len(data):
            continue
        # manager.retries = 0
        # manager.analyzer.retries = 0
        # message = manager.graph.invoke({"messages": [], "history": [], "query": HumanMessage(content=question), "dialog_id": dialog_id})
        final_message = {}
        workflow = AgentWorkFlow(dialog)
        async for ans in workflow._run(question, []):
            final_message = ans
        total_time = workflow.total_time
        total_in_token = workflow.total_in_token
        total_out_token = workflow.total_out_token
        print(idx, question, total_time, total_in_token + total_out_token)
        print(final_message["response"]["answer"])
        item = {
            "user_input": question,
            "response": final_message['response']['answer'],
            "retrieved_contexts": final_message['knowledge'],
            "reference": references[idx],
            "time": total_time,
            "total_in_token": total_in_token,
            "total_out_token": total_out_token,
        }
        if "metadata" in final_message:
            item["metadata"] = final_message["metadata"]
        data.append(item)
        save_output_file(output_file, data)
    # eval_dataset = Dataset.from_dict(dataset)
    # score = evaluate(eval_dataset, metrics=[
    #     context_precision,
    #     faithfulness,
    #     answer_relevancy,
    #     context_recall
    # ])
    # dataset["context_precision"] = score["context_precision"]
    # dataset["faithfulness"] = score["faithfulness"]
    # dataset["answer_relevancy"] = score["answer_relevancy"]
    # dataset["context_recall"] = score["context_recall"]

    
    save_output_file(output_file, data)
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-file", default=False, type=str, help="Path to input file")
    parser.add_argument("--output-file", default=False, type=str, help="Path to output file")
    parser.add_argument("--dialog-id", default=False, type=str, help="Id of conversation")
    if len(sys.argv) < 3:
        parser.print_help()
        sys.exit(1)
    args = parser.parse_args()
    try:
        asyncio.run(run_test(args.dataset_file, args.output_file, 
                 args.dialog_id ))
    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)
        