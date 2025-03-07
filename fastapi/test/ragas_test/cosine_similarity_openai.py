import openai
import pandas as pd
import torch
import argparse
from sentence_transformers import util
import re
from openpyxl.utils.exceptions import IllegalCharacterError

# Hàm lấy embedding từ OpenAI
def get_openai_embedding(texts, api_key, model="text-embedding-3-large"):
    client = openai.OpenAI(api_key=api_key)
    response = client.embeddings.create(input=texts, model=model)
    embeddings = [d.embedding for d in response.data]
    return torch.tensor(embeddings)  # Convert thành PyTorch tensor để tính cosine similarity


def main(file_path, output_file, api_key, json_file=None):
    model_name = "text-embedding-3-large"
    
    df = pd.read_excel(file_path)
    
    if "response" in df.columns:
        df["response"] = df["response"].fillna('').astype(str)
    elif json_file:
        json_df = pd.read_json(json_file)
        df["response"] = json_df["response"].fillna('').astype(str)
        
    else:
        raise ValueError("Column 'response' not found in the input file")
    if "reference" in df.columns:
        df["reference"] = df["reference"].fillna('').astype(str)
        
    for idx, row in df.iterrows():
        print(f"Processing row {idx}...")

        response = row['response']
        reference = row['reference']
        sentences = [response, reference]

        # Gọi OpenAI để lấy embedding
        embeddings = get_openai_embedding(sentences, api_key, model=model_name)
        
        # Tính cosine similarity
        similarity = util.pytorch_cos_sim(embeddings[0], embeddings[1])

        df.at[idx, 'similarity-text-embedding-3-large'] = similarity.item()
        print("Similarity:", similarity.item())
    try:
        df.to_excel(output_file, index=False)
    except IllegalCharacterError:
        df.to_excel(output_file, index=False, engine='xlsxwriter')
    print("Done!")  

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-file", required=True, type=str, help="Path to input file")
    parser.add_argument("--output-file", required=True, type=str, help="Path to output file")
    parser.add_argument("--api-key", required=True, type=str, help="OpenAI API key")
    parser.add_argument("--json-file", type=str, help="Path to json file")

    args = parser.parse_args()
    main(args.input_file, args.output_file, args.api_key, args.json_file)
