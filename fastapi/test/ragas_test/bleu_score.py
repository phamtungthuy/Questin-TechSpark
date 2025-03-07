import openai
import pandas as pd
import argparse
import nltk
import tiktoken
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from underthesea import word_tokenize
from openpyxl.utils.exceptions import IllegalCharacterError


def calculate_bleu(reference, response):
    reference_tokens = [word_tokenize(reference, format="text").split()]  # Tokenize tiếng Việt
    response_tokens = word_tokenize(response, format="text").split()
    
    smoothie = SmoothingFunction().method1  # Làm mịn BLEU để tránh giá trị 0
    return sentence_bleu(reference_tokens, response_tokens, weights=(0.25, 0.25, 0.25, 0.25), smoothing_function=smoothie)



def main(file_path, output_file, json_file=None):
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
        
        bleu_score = calculate_bleu(reference, response)
        
        df.at[idx, 'BLEU-4 Score'] = bleu_score
        
        print(f"BLEU-4 Score: {bleu_score}")
    
    try:
        df.to_excel(output_file, index=False)
    except IllegalCharacterError:
        df.to_excel(output_file, index=False, engine='xlsxwriter')
    
    print("Done!")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-file", required=True, type=str, help="Path to input file")
    parser.add_argument("--output-file", required=True, type=str, help="Path to output file")
    parser.add_argument("--json-file", type=str, help="Path to json file")
    
    args = parser.parse_args()
    main(args.input_file, args.output_file, args.json_file)
