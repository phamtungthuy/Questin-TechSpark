import sys
import argparse
import traceback
import pandas as pd

def calculate_mean_score(file_paths):
    combined_metrics = []
    for file_path in file_paths:
        try:
            df = pd.read_excel(file_path)
            # df = df[:29]
            print(df.iloc[-1]["user_input"])
            # df = df[~df['response'].str.lower().str.contains('không tìm thấy câu trả lời mà bạn muốn trong kho kiến thức', na=False)]
            print(f"Đang xử lý file: {file_path} (Số dòng: {len(df)})")
            
            # Bỏ qua các dòng có response bắt đầu bằng "Không tìm thấy" nếu cần
            
            mean_metrics = df[['context_precision', 'faithfulness', 'answer_relevancy', 'context_recall']].mean()
            combined_metrics.append(mean_metrics)
        except Exception as e:
            print(f"Không thể xử lý file {file_path}: {e}")
            traceback.print_exc()

    if not combined_metrics:
        print("Không có file hợp lệ để xử lý.")
        return

    # Tính trung bình cộng các metrics từ tất cả các file
    overall_mean = pd.concat(combined_metrics, axis=1).mean(axis=1)
    print("\nTrung bình tổng hợp của các metrics:")
    print(overall_mean)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--file-paths', nargs='+', type=str, help='Paths to the files (space-separated list)')
    if len(sys.argv) < 2:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()
    try:
        calculate_mean_score(args.file_paths)
    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
        sys.exit(1)