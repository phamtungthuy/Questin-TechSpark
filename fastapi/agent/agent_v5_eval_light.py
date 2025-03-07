from db.db_services.llm_service import LLMBundle, TenantLLMService
from db.constants import LLMType, ParserType
from openai import OpenAI
import openai
from textwrap import dedent
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.db_services.dialog_service import DialogService
from pydantic import BaseModel
from db.settings import retrievaler
import json
from copy import deepcopy
from datetime import datetime
from agent.agent_utils import contact_info, expand_abbreviations
import asyncio
import time
import tiktoken
import textwrap


class Parameters(BaseModel):
    pass

class RetrievalParameters(BaseModel):
    query: str


def decorate_answer(answer, kbinfos, embd_mdl, vector_similarity_weight, citation=False):
    if citation:
        answer, idx = retrievaler.insert_citations(answer, [ck["content_ltks"] for ck in kbinfos["chunks"]],
                                                [ck["vector"] for ck in kbinfos["chunks"]],
                                                embd_mdl=embd_mdl,
                                                tkweight=1 - vector_similarity_weight,
                                                vtweight=vector_similarity_weight)
        idx = set([kbinfos["chunks"][int(i)]["doc_id"] for i in idx])
        recall_docs = [d for d in kbinfos["doc_aggs"] if d["doc_id"] in idx]
    else: recall_docs = []
    if not recall_docs:
        recall_docs = kbinfos["doc_aggs"]
    kbinfos["doc_aggs"] = recall_docs
    refs = deepcopy(kbinfos)
    for c in refs["chunks"]:
        if c.get("vector"):
            del c["vector"]
    if answer.lower().find("invalid key") >= 0 or answer.lower().find("invalid api") >= 0:
        answer += " Please set LLM API-Key in 'User Setting -> Model Providers -> API-Key'"
    return {"answer": answer, "reference": refs}      

def rerank_results(query, ranks, dialog, top_n=4, rerank_mdl=None):
    if not ranks["chunks"]:
        return ranks
    
    ranks["doc_aggs"] = {}    

    if not rerank_mdl:
        sim, _, __ = retrievaler.manual_rerank(dialog.id, [ck["content_with_weight"] for ck in ranks["chunks"]], query)
    else:
        sim, _, __ = retrievaler.manual_rerank_by_model(rerank_mdl, [ck["content_with_weight"] for ck in ranks["chunks"]], query,
                                                                 1 - dialog.vector_similarity_weight, dialog.vector_similarity_weight)

    chunks = [chunk for sim_eval, chunk in sorted(zip(sim, [ck for ck in ranks["chunks"]]), key=lambda pair: pair[0], reverse=True)
              if sim_eval >= 0.3]
    ranks["chunks"] = chunks
    for ck in ranks["chunks"]:
        dnm = ck["docnm_kwd"]
        did = ck["doc_id"]
        if dnm not in ranks["doc_aggs"]:
            ranks["doc_aggs"][dnm] = {"doc_id": did, "count": 0}
        ranks["doc_aggs"][dnm]["count"] += 1
    ranks["doc_aggs"] = [{"doc_name": k,
                            "doc_id": v["doc_id"],
                            "count": v["count"]} for k,
                            v in sorted(ranks["doc_aggs"].items(),
                                    key=lambda x:x[1]["count"] * -1)]
    return ranks

def merged_results(ranks_1, ranks_2):
    chunks = []
    for chunk in ranks_1["chunks"] + ranks_2["chunks"]:
        if chunk["chunk_id"] not in [c["chunk_id"] for c in chunks] and chunk["content_with_weight"] not in [c["content_with_weight"] for c in chunks]:
            chunks.append(chunk)
    ranks = {"total": ranks_1["total"] + ranks_2["total"], "chunks": chunks, "doc_aggs": {}}
    for ck in chunks:
        dnm = ck["docnm_kwd"]
        did = ck["doc_id"]
        if dnm not in ranks["doc_aggs"]:
            ranks["doc_aggs"][dnm] = {"doc_id": did, "count": 0}
        ranks["doc_aggs"][dnm]["count"] += 1
    ranks["doc_aggs"] = [{"doc_name": k,
                            "doc_id": v["doc_id"],
                            "count": v["count"]} for k,
                            v in sorted(ranks["doc_aggs"].items(),
                                    key=lambda x:x[1]["count"] * -1)]
    return ranks     

def calculate_in_token(messages, tokenizer):
    prompt_text = "".join([m["role"] + m["content"] for m in messages])
    prompt_tokens = len(tokenizer.encode(prompt_text)) 
    
    return prompt_tokens

def calculate_out_token(response, tokenizer):
    completion_tokens = 0
    completion_text = ""
    
    for chunk in response:
        if chunk.choices[0].delta.content:
            completion_text += chunk.choices[0].delta.content
            
        if chunk.choices[0].delta.tool_calls:
            for tool_call in chunk.choices[0].delta.tool_calls:
                if tool_call.function.name:
                    function_name = tool_call.function.name
                    arguments = tool_call.function.arguments
                    completion_text += function_name + arguments
                
    completion_tokens = len(tokenizer.encode(completion_text))
    return completion_tokens

class AgentWorkFlow:
    def __init__(self, dialog):
        model_config = TenantLLMService.get_api_key(dialog.tenant_id, dialog.llm_id)
        if model_config:
            model_config = model_config.to_dict()
        else:
            raise ValueError("No model config found")
        self.chat_mdl = OpenAI(api_key=model_config["api_key"],
                               base_url=model_config["api_base"])
        self.rerank_mdl = None
        self.chat_mdl_name = model_config["llm_name"]
        if dialog.rerank_id:
            self.rerank_mdl = LLMBundle(dialog.tenant_id, LLMType.RERANK, dialog.rerank_id)
        self.kbs = KnowledgebaseService.get_by_ids(dialog.kb_ids)
        self.dialog= dialog
        embd_nms = list(set([kb.embd_id for kb in self.kbs]))
        if len(embd_nms) != 1:
            raise ValueError("The number of embd_nms is not 1")
        self.embd_mdl = LLMBundle(dialog.tenant_id, LLMType.EMBEDDING, embd_nms[0])
        self.tools = {
            "next": openai.pydantic_function_tool(Parameters, name="next", description="Get next step"),
            "retrieval": openai.pydantic_function_tool(RetrievalParameters, name="retrieval", description="Retrieval knowledge")
        }
        self.current_year = datetime.now().year  
        self.previous_year = self.current_year - 1  
        self.tokenizer = tiktoken.encoding_for_model("gpt-4o-mini")
        self.total_time = 0
        self.total_in_token = 0
        self.total_out_token = 0
        self.original_query = ""
        self.search_query = []
        self.findings = []
        self.knowledge = {"total": 0, "chunks": [], "doc_aggs": {}}
        self.think = ""
        self.answer_msg = ""
        self.analyze_msg = ""
        self.state_msg = ""
        self.citation_status = False
        self.reference = {}
        self.reflection = []
        self.should_answer = False
        self.synthesis = ""
        
    def _yield_response(self):
        """Helper function to yield standardized response format"""
        chunks = self.knowledge["chunks"]
        context = [ck["content_with_weight"] for ck in chunks]
        return {
            "state_msg": self.state_msg,
            "response": {
                "answer": self.answer_msg,
                "reference": self.reference or {}
            },
            "knowledge": context,
            "think": self.think,
            "citation": self.citation_status
        }
    
    def analyze(self, query: str = None):
        query = query or self.original_query
        system_prompt = f"""Bạn là chuyên gia phân tích. Nhiệm vụ của bạn là:

Phân tích câu hỏi của người dùng.
Xác định loại câu hỏi (hướng dẫn, so sánh, phân tích, …).
Xác định chủ đề chính, yêu cầu cụ thể và ngữ cảnh (nếu có).
Phân rã câu hỏi thành các yếu tố nhỏ hỗ trợ tạo truy vấn tìm kiếm hiệu quả.
"""
        user_prompt = f"""Hãy phân tích câu hỏi:
        <query>
        {query}
        </query>
        """
        messages = [
                {"role": "system", "content": dedent(system_prompt)},
                {"role": "user", "content": user_prompt}
            ]

        response = self.chat_mdl.chat.completions.create(
            model=self.chat_mdl_name,
            messages=messages,
            stream=True
        )
        
        response_chunks = []
        for chunk in response:
            if chunk.choices[0].delta.content:
                self.analyze_msg += chunk.choices[0].delta.content
                self.think += chunk.choices[0].delta.content
                yield self._yield_response()
            response_chunks.append(chunk)
        
        in_token_num = calculate_in_token(messages, self.tokenizer)
        out_token_num = calculate_out_token(response_chunks, self.tokenizer)
        self.total_in_token += in_token_num
        self.total_out_token += out_token_num
    

    def generate_questions(self, query: str = None, guidance: str = None):
        query = query or self.original_query
        guidance = guidance or self.analyze_msg
        system_prompt = """
        Bạn là chuyên gia tạo câu hỏi cho việc tìm kiếm. 
        Dựa trên phân tích từ chuyên gia.
        Hãy tạo tmột danh sách các truy vấn SERP để tìm kiếm thông tin.
        Trả về tối đa 3 truy vấn, nhưng bạn có thể trả về ít hơn nếu câu hỏi người dùng rõ ràng.
        Đảm bảo mỗi câu truy vấn là duy nhất và không giống nhau.
        Trả về kết quả dưới dạng object chứa danh sách các truy vấn.
        """
        
        user_prompt=f"""
        Hãy tạo truy vấn dựa thông tin sau:
        
        Câu hỏi người dùng:
        <query>
        {query}
        </query>
        
        Phân tích từ chuyên gia:
        <analyzer>
        {guidance}
        </analyzer>
        """
        messages = [
            {"role": "system", "content": dedent(system_prompt)},
            {"role": "user", "content": user_prompt}
        ]
        retry = 0
        
        while retry < 2:
            retry += 1
            try:
                response = self.chat_mdl.chat.completions.create(
                    model=self.chat_mdl_name,
                    messages=messages,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {
                            "name": "queries_response",
                            "strict": True,
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "queries": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        }
                                    }
                                },
                                "required": ["queries"],
                                "additionalProperties": False
                            }
                        },
                    },
                )
                self.total_in_token += response.usage.prompt_tokens
                self.total_out_token += response.usage.completion_tokens
                response = eval(response.choices[0].message.content)
                self.search_query.append(response["queries"])
                for query in self.search_query[-1]:
                    print("Tìm kiếm: ", query)
                break
            except Exception as e:
                import traceback
                traceback.print_exc(e)
                pass
            
    
    async def retrieval(self, top_k=None):
        top_n = top_k if top_k else self.dialog.top_n
        ranks = {"total": 0, "chunks": [], "doc_aggs": {}}

        async def retrie(query):
            external_source = False
            return retrievaler.retrieval(
                query,
                self.embd_mdl,
                self.dialog.tenant_id,
                self.dialog.kb_ids,
                1,
                top_n,
                self.dialog.similarity_threshold,
                self.dialog.vector_similarity_weight,
                doc_ids=None,
                top=self.dialog.top_k,
                aggs=False,
                rerank_mdl=None,
                external_source=external_source
            )

        tasks = [retrie(query) for query in self.search_query[-1]]
        results = await asyncio.gather(*tasks)

        for kbinfos in results:
            ranks["total"] += kbinfos["total"]
            for ck in kbinfos["chunks"]:
                if ck["chunk_id"] not in [c["chunk_id"] for c in ranks["chunks"]]:
                    ranks["chunks"].append(ck)
        self.findings.append(ranks)
        self.knowledge = merged_results(ranks, self.knowledge)
        self.knowledge = rerank_results(self.original_query, deepcopy(self.knowledge), self.dialog, 10, self.rerank_mdl)
    
    def data_synthesis(self):
        chunks = self.knowledge["chunks"]
        context = "\n\n\n".join([ck["content_with_weight"] for ck in chunks])
        system_prompt = """Bạn là chuyên gia tổng hợp dữ liệu.
Nhiệm vụ của bạn là tóm tắt và tổng hợp thông tin từ các nguồn dữ liệu đã cung cấp thành một bối cảnh chung dựa trên câu hỏi của người dùng.
Hãy trích xuất những điểm chính, số liệu và chỉ số quan trọng, cùng với những kết luận nổi bật từ các thông tin này.
"""
        user_prompt = f"""
    Dựa trên câu hỏi của người dùng:
    <query>
    {self.original_query}
    </query>

    Hãy tổng hợp các thông tin dưới đây thành một đoạn tóm tắt chung, bao gồm các dữ liệu chính và quan trọng:
    <knowledge>
    {context}
    </knowledge>
    """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        response = self.chat_mdl.chat.completions.create(
            model=self.chat_mdl_name,
            messages=messages,
            temperature=0
        )
        synthesis = response.choices[0].message.content
        self.synthesis = synthesis
        self.think += synthesis
        self.total_in_token += response.usage.prompt_tokens
        self.total_out_token += response.usage.completion_tokens
        
    def reflecter(self, query: str = None):
        query = query or self.original_query      
        chunks = self.knowledge["chunks"]
        context = "\n\n\n".join([ck["content_with_weight"] for ck in chunks])
        system_prompt = """Bạn là chuyên gia phản ánh.
Nhiệm vụ của bạn là phân tích thông tin từ các câu hỏi truy vấn và đánh giá xem các dữ liệu hiện có đã đủ để trả lời câu hỏi chưa.
CHỈ KHI thiếu các thông tin CỰC KỲ QUAN TRỌNG mới tìm kiếm lại và chỉ ra những điểm còn thiếu một cách chi tiết và giải thích tại sao chúng quan trọng.
Nếu dữ liệu đã đủ, không cần thiết phải bày vẽ để tìm kiếm lại.
Sử dụng kiến thức chuyên sâu và cập nhật; nếu cần thiết, hãy trích dẫn ví dụ, nghiên cứu hoặc thông tin liên quan để hỗ trợ phân tích.
Bạn chỉ được sử dụng kiến thức từ nguồn dữ liệu đã cung cấp, KHÔNG ĐƯỢC PHÉP SỬ DỤNG THÊM THÔNG TIN NGOÀI.
"""
        user_prompt = f"""
Bạn hãy phân tích xem những thông tin dưới đây có đủ để trả lời câu hỏi không.
CHỈ KHI thiếu các thông tin CỰC KỲ QUAN TRỌNG thì mới nêu rõ những điểm còn thiếu.
Nếu thông tin đã đủ, đừng có bày vẽ thêm việc tìm kiếm và hãy dừng việc tìm kiếm lại.
Những câu hỏi truy vấn:
<query>
{query}
</query>

Thông tin tổng hợp:
<knowledge>
{context}
</knowledge>

KẾT LUẬN (JSON):
- "should_search_again": True nếu THIẾU số liệu BẮT BUỘC
- "reflection": Giải thích chi tiết từng điểm thiếu
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        retry = 0 
        while retry < 2:
            retry += 1
            try:
                response = self.chat_mdl.chat.completions.create(
                    model=self.chat_mdl_name,
                    messages=messages,
                    temperature=0,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {
                            "name": "reflection_response",
                            "strict": True,
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "should_search_again": {
                                        "type": "boolean",
                                    },
                                    "reflection": {
                                        "type": "string"
                                    }
                                },
                                "required": ["should_search_again", "reflection"],
                                "additionalProperties": False
                            }
                        }
                    }
                )
                self.total_in_token += response.usage.prompt_tokens
                self.total_out_token += response.usage.completion_tokens
                response = json.loads(response.choices[0].message.content)
                self.think += response["reflection"]
                self.reflection.append(response["reflection"])
                if response["should_search_again"]:
                    self.state_msg = "Cần tìm kiếm lại thông tin"
                else:
                    self.should_answer = True
                    self.state_msg = "Đã có đủ thông tin để trả lời"
                yield self._yield_response()
                break
            except Exception as e:
                import traceback
                traceback.print_exc(e)
                pass
    
    def reflect_search(self):
        query = self.original_query
        search_query = self.search_query
        reflection = self.reflection
        guidance = ""
        for i in range(len(search_query) - 1, -1, -1):
            guidance += f"""
            Lần tìm kiếm thứ {i + 1}
            <attempt-{i+1}>
            Câu hỏi dùng để truy vấn: {search_query[i]}
            Lý do thất bại: {reflection[i]}
            </attempt-{i+1}>
            
            """
        system_prompt = """
        Bạn là chuyên gia tạo câu hỏi cho việc tìm kiếm. 
        Dựa trên sự thất bại của những chuyên gia tìm kiếm trước đó.
        Hãy học hỏi dựa trên sự chỉ trích của họ và tạo ra những truy vấn tìm kiếm mới.
        Trả về tối đa 3 truy vấn, nhưng bạn có thể trả về ít hơn nếu không cần thiết và những câu hỏi giống nhau.
        Đảm bảo mỗi câu truy vấn là duy nhất và ý nghĩa KHÔNG ĐƯỢC giống nhau.
        Trả về kết quả dưới dạng object chứa danh sách các truy vấn.
        """
        
        user_prompt=f"""
        Hãy tạo truy vấn dựa câu hỏi của người dùng và kinh nghiệm thất bại của những người đi trước:
        
        Câu hỏi ban đầu của người dùng:
        <query>
        {query}
        </query>
        
        Kinh nghiệm thất bại của những người đi trước:
        <analyzer>
        {guidance}
        </analyzer>
        """
        messages = [
            {"role": "system", "content": dedent(system_prompt)},
            {"role": "user", "content": user_prompt}
        ]
        retry = 0
        
        while retry < 2:
            retry += 1
            try:
                response = self.chat_mdl.chat.completions.create(
                    model=self.chat_mdl_name,
                    messages=messages,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {
                            "name": "queries_response",
                            "strict": True,
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "queries": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        }
                                    }
                                },
                                "required": ["queries"],
                                "additionalProperties": False
                            }
                        },
                    },
                )
                self.total_in_token += response.usage.prompt_tokens
                self.total_out_token += response.usage.completion_tokens
                response = eval(response.choices[0].message.content)
                self.search_query.append(response["queries"])
                for query in self.search_query[-1]:
                    print("Tìm kiếm: ", query)
                break
            except Exception as e:
                import traceback
                traceback.print_exc(e)
                pass
    
    def answer(self, query: str = None):
        query = query or self.original_query
        chunks = self.knowledge["chunks"]
        context = "\n\n\n".join([ck["content_with_weight"] for ck in chunks])
        self.state_msg = ""
        system_prompt = """Bạn là chuyên gia trả lời câu hỏi. 
        Nhiệm vụ của bạn là phân tích câu hỏi của người dùng và cung cấp câu trả lời chính xác, chi tiết và thuyết phục. 
        Sử dụng kiến thức chuyên sâu và cập nhật; nếu cần thiết, hãy trích dẫn ví dụ, nghiên cứu hoặc thông tin liên quan để hỗ trợ câu trả lời.
        Bạn chỉ được sử dụng kiến thức từ nguồn kiến thức người dùng cung cấp, KHÔNG ĐƯỢC PHÉP SỬ DỤNG THÊM THÔNG TIN NGOÀI NỘI DUNG THAM KHẢO.
        """
        
        user_prompt = f"""
        Hãy trả lời câu hỏi:
        <query>
        {query}
        </query>
        
        Dựa trên thông tin:
        <knowledge>
        {context}
        </knowledge>
        """
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        response = self.chat_mdl.chat.completions.create(
            model=self.chat_mdl_name,
            messages=messages,
            temperature=0,
            stream=True,
        )
        response_chunks = []
        for chunk in response:
            if chunk.choices[0].delta.content:
                self.answer_msg += chunk.choices[0].delta.content
                yield self._yield_response()
            response_chunks.append(chunk)
        
        in_token_num = calculate_in_token(messages, self.tokenizer)
        out_token_num = calculate_out_token(response_chunks, self.tokenizer)
        self.total_in_token += in_token_num
        self.total_out_token += out_token_num

    
    async def _run(self, query: str, history: list[object]):
        start_time = time.time()
        self.original_query = query

        
        # for res in self.analyze():
        #     yield res
        # self.generate_questions()
        self.search_query.append([query])
        await self.retrieval()
        reflection_number = 1
        for i in range(reflection_number):
            for res in self.reflecter():
                yield res
            if self.should_answer:
                break
            self.reflect_search()
            await self.retrieval()
        for res in self.answer():
            yield res
        end_time = time.time()
        total_time = end_time - start_time
        
        self.total_time = total_time
            
def clean_text(text: str) -> str:
    import unicodedata
    # Cách 1: Normalize về dạng NFKC
    normalized = unicodedata.normalize("NFKC", text)
    # Cách 2: Nếu vẫn có lỗi, bạn có thể thay thế các ký tự không encode được:
    cleaned = normalized.encode("utf-8", "replace").decode("utf-8")
    return cleaned
            
async def main():
            
    question = input("Question: ")
    question = clean_text(question)
    dialog_id = "1fa90d6ae4b711ef80c00242ac120006"
    e, dialog = DialogService.get_by_id(dialog_id)
    if not e:
        raise ValueError("Dialog not found")
    agent = AgentWorkFlow(dialog)
    think = ""
    answer = ""
    history = [
    ]
    
    final_ans = {}
    
    async for ans in agent._run(question, history):
        if ans["state_msg"]:
            state_msg = ans["state_msg"]
            print(f"\n\n-------------{state_msg}-------------\n\n")
        if ans["response"]["answer"] \
            and answer != ans["response"]["answer"]:
            if not answer:
                next_token = ans["response"]["answer"]
            else: 
                next_token = ans["response"]["answer"].split(answer)[-1]
            answer = ans["response"]["answer"]
            print(next_token, end="")
        if ans["think"] and think != ans["think"]:
            if not think:
                next_token = ans["think"]
            else:
                next_token = ans["think"].split(think)[-1]
            think = ans["think"]
            print(next_token, end="")
        final_ans = ans
        
    print("Total time: ", agent.total_time)
    print("Total in token: ", agent.total_in_token)
    print("Total out token: ", agent.total_out_token)
            
if __name__ == '__main__':
    asyncio.run(main())     