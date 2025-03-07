from sentence_transformers import SentenceTransformer, util
import pandas as pd
import torch
import argparse

def main(file_path, output_file):
    
    model = SentenceTransformer('keepitreal/vietnamese-sbert')  
    
    df = pd.read_excel(file_path)
    if "response" in df.columns:
        df["response"] = df["response"].fillna('').astype(str)
    if "reference" in df.columns:
        df["reference"] = df["reference"].fillna('').astype(str)
    for idx, row in df.iterrows():
        print(idx)
        response = row['response']
        reference = row['reference']

        sentences = [response, reference]

        embeddings = model.encode(sentences, convert_to_tensor=True)
        similarity = util.pytorch_cos_sim(embeddings[0], embeddings[1])

        df.at[idx, 'similarity'] = similarity.item()
        print("Similarity: ", similarity.item())

    df.to_excel(output_file, index=False)

    print("Done!")  
    
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-file", default=False, type=str, help="Path to input file")
    parser.add_argument("--output-file", default=False, type=str, help="Path to output file")

    args = parser.parse_args()
    main(args.input_file, args.output_file)
    
        
        
