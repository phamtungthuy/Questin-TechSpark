import json
import tiktoken



with open("./scale/questin_base_law.json", "r", encoding="utf-8") as file:
    data = json.loads(file.read())
    
tokenizer = tiktoken.encoding_for_model("gpt-4o-mini")
result = []
tmp = []
for item in data:
    retrieved_contexts = item["retrieved_contexts"]
    user_input = item["user_input"]
    context = "\n\n\n".join(retrieved_contexts)
    tmp_item = {
        "user_input": user_input,
        "response": item["response"],
        "retrieved_contexts": retrieved_contexts,
        "reference": item["reference"],
        "time": item["time"],
        "total_tokens": item["total_in_token"] + item["total_out_token"]
    }
    metadata = item["metadata"]
    search_query = metadata["search_query"][1:]
    search_time = metadata["search_time"]
    reflect_time = metadata["reflect_time"]
    generate_questions_time = metadata["generate_questions_time"]
    while len(search_query) < 3:
        search_query.append("")
    while len(search_time) < 3:
        search_time.append(0)
    while len(reflect_time) < 3:
        reflect_time.append(0)
    while len(generate_questions_time) < 3:
        generate_questions_time.append(0)
    for idx, (refl_time, gen_time) in enumerate(zip(reflect_time, generate_questions_time)):
        tmp_item[f"reflect_time_{idx}"] = refl_time
        tmp_item[f"generate_questions_time_{idx}"] = gen_time
    for idx, (query, time) in enumerate(zip(search_query, search_time)):
        tmp_item[f"search_query_{idx}"] = query
        tmp_item[f"search_time_{idx}"] = time
    tmp_item["answer_time"] = metadata["answer_time"]
    # user_prompt = f"""
    # Hãy trả lời câu hỏi:
    # <query>
    # {user_input}
    # </query>
    
    # Dựa trên thông tin:
    # <knowledge>
    # {context}
    # </knowledge>
    # """
    # prompt_tokens = len(tokenizer.encode(user_prompt))
    # total_tokens = item["total_out_token"] + item["total_in_token"]
    result.append(tmp_item)
import pandas as pd

df = pd.DataFrame(result)
df.to_excel("./scale/questin_base_law.xlsx", index=False)
# print(sum(tmp))
# with open("./node-deep-research/node_deep_research_metric.json", "w", encoding="utf-8") as file:
    # file.write(json.dumps(result, ensure_ascii=False))
    
    