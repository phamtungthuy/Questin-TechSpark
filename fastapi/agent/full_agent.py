from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from pydantic import BaseModel, Field
from db.settings import retrievaler, kg_retrievaler
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.constants import LLMType, ParserType
from db.db_services.llm_service import LLMBundle, TenantLLMService
from db.db_services.dialog_service import DialogService
from langchain_core.messages import AnyMessage, SystemMessage
from typing import TypedDict, Annotated
import threading
import operator
import json
from langchain_core.runnables import RunnableConfig
from copy import deepcopy
from datetime import datetime
from agent.agent_utils import expand_abbreviations, add_contact_info
from agent.settings import flow_logger
from api.settings import stat_logger

class Question(BaseModel):
    original: str = Field(description="The exact phrasing of the question as it appears in the input query text.")
    paraphrased: str = Field(description="A rephrased version of the question in formal Vietnamese, ensuring clarity, conciseness, and correctness while preserving the original meaning.")
    keyword: str = Field(description="An array of KEYWORDS appearing explicitly in the question or its context. The keywords need to be refined to the lowest meaning level and accurately reflect the content of the question. You could consider nouns, verbs, adjectives and number.")
    context: str = Field(description="An array of RELEVANT CONTEXT that supports or frames the question. This includes any implied conditions, background information, or scenarios that the asker assumes. Do not leave context empty.")
    target: str = Field(description="The user's intention when posing the question.")
    
class Queries(BaseModel):
    questions: list[str] = Field(description="A list of questions extracted from the query text.")

class Validate_Queries(BaseModel):
    enough: bool = Field(description="Whether the provided knowledge is enough to answer the question.")
    questions: list[str] = Field(description="A list of follow-up questions if the provided knowledge is insufficient.")

class Reflection_Queries(BaseModel):
    enough: bool = Field(description="Decide whether the questions array is sufficient to indicate the requirements of input query or not.")
    additional_questions: list[str] = Field(description="An array of questions that you want to implement to the AnalystAgent to improve the question array. Just 2 questions reflected.")
    keywords: list[str] = Field(description="An array of keywords in input query text.")
    extending_questions: list[str] = Field(description="An array of extending questions that has the same meaning as the input query text and includes keywords's synonyms. Just 1 extending questions reflected.")
    
class Potential_Answer(BaseModel):
    paraphrased_questions: str = Field(description="An array of paraphrased versions of user's question.")
    useful_information: str = Field(description="All extracted useful information from knowledge base that could use to answer user's questions or its paraphrased versions (questions in `paraphrased_questions` field).")
    proposed_answer: str = Field(description="Answer for user's question. Your response should also take the chat history into account.")    

class Validator_Queries_v2(BaseModel):
    enough: bool = Field(description="Whether the provided knowledge is enough to answer the question.")
    supporting_questions: list[str] = Field(description="List of questions to search for missing information.")
    
class Validator_Evaluation(BaseModel):
    enough: bool = Field(description="Whether the provided knowledge is enough to answer the question.")
    reason: list[str] = Field(description="The missing aspects in existing information")
    
class Validator_Queries(BaseModel):
    supporting_questions: list[str] = Field(description="List of questions to search for missing information.")
    

class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    state_msg: str
    query: str
    search_query: str
    merged_query: str
    search_feedback: list[str]
    history: list[AnyMessage]
    analyst_reflection: list[AnyMessage]
    kbinfos: dict[str, any]
    response: dict[str, any]
    state: str
    summarized_history: str


def decorate_answer(answer, kbinfos, embd_mdl, vector_similarity_weight):
    answer, idx = retrievaler.insert_citations(answer, [ck["content_ltks"] for ck in kbinfos["chunks"]],
                                                [ck["vector"] for ck in kbinfos["chunks"]],
                                                embd_mdl=embd_mdl,
                                                tkweight=1 - vector_similarity_weight,
                                                vtweight=vector_similarity_weight)
    idx = set([kbinfos["chunks"][int(i)]["doc_id"] for i in idx])
    recall_docs = [d for d in kbinfos["doc_aggs"] if d["doc_id"] in idx]
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
    if not rerank_mdl:
        sim, tsim, vsim = retrievaler.manual_rerank(dialog.id, [ck["content_with_weight"] for ck in ranks["chunks"]], query)
    else:
        sim, tsim, vsim = retrievaler.manual_rerank_by_model(rerank_mdl, [ck["content_with_weight"] for ck in ranks["chunks"]], query,
                                                                 1 - dialog.vector_similarity_weight, dialog.vector_similarity_weight)

    chunks = [chunk for _, chunk in sorted(zip(sim, [ck for ck in ranks["chunks"]]), key=lambda pair: pair[0], reverse=True)]
    ranks["chunks"] = chunks[:top_n]
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

class AgentWorkFlow:
    def __init__(self, dialog, system=None):

        graph = StateGraph(AgentState)
        graph.add_node("guarail", self.guarail_execute)
        graph.add_node("manager", self.manager_execute)
        graph.add_node("manager_answer", self.manager_answer_execute)
        graph.add_node("cleaner", self.cleaner_execute)
        graph.add_node("analyzer", self.analyzer_execute)
        graph.add_node("reflection", self.reflection_execute)
        graph.add_node("f_search", self.f_search)
        graph.add_node("searcher", self.searcher_execute)
        graph.add_node("validator", self.validator_execute)
        graph.add_node("search_reflector", self.search_reflector_execute)
        graph.add_node("answer", self.answer_execute)
        graph.add_conditional_edges("manager", self.should_analyze, {True: "analyzer", False: "manager_answer"})
        # graph.add_edge("cleaner", "analyzer")
        graph.add_edge("reflection", "analyzer")
        graph.add_edge("analyzer", "searcher")
        # graph.add_conditional_edges("analyzer", self.should_reflect, {True: "reflection", False: "searcher"})
        graph.add_conditional_edges("searcher", self.should_validate, {True: "validator", False: "answer"})
        graph.add_conditional_edges("validator", self.should_search_again, {True: "search_reflector", False: "answer"})
        graph.add_edge("search_reflector", "searcher")
        graph.add_edge("f_search", "manager")
        graph.add_conditional_edges("guarail", self.should_f_search, {True: "f_search", False: END})
        graph.add_edge("cleaner", "guarail")
        graph.set_entry_point("cleaner")
        model_config = TenantLLMService.get_api_key(dialog.tenant_id, dialog.llm_id)
        if model_config:
            model_config = model_config.to_dict()
        else:
            raise ValueError("No model config found")
        model = ChatOpenAI(model=model_config["llm_name"], api_key=model_config["api_key"],
                                     base_url=model_config["api_base"])
        self.rerank_mdl = None
        if dialog.rerank_id:
            self.rerank_mdl = LLMBundle(dialog.tenant_id, LLMType.RERANK, dialog.rerank_id)
        self.graph = graph.compile()
        self.model_config = model_config
        self.model = model
        self.validate_retries = 0
        self.should_search_again = True
        self.should_f_search = False
        self.manager_retries = 0
        self.reflect_retries = 0
        self.MAX_RETRIES = 1
        self.kbs = KnowledgebaseService.get_by_ids(dialog.kb_ids)
        self.dialog= dialog
        embd_nms = list(set([kb.embd_id for kb in self.kbs]))
        if len(embd_nms) != 1:
            raise ValueError("The number of embd_nms is not 1")
        self.embd_mdl = LLMBundle(dialog.tenant_id, LLMType.EMBEDDING, embd_nms[0])
    
    def should_search_again(self, state: AgentState):
        return self.should_search_again
    
    def should_analyze(self, state: AgentState):
        return self.manager_retries > 0
    
    def should_reflect(self, state: AgentState):
        return self.reflect_retries < self.MAX_RETRIES
        
    def should_validate(self, state: AgentState):
        return self.validate_retries < self.MAX_RETRIES
    
    def should_f_search(self, state: AgentState):
        return self.should_f_search
    
    async def guarail_execute(self, state: AgentState, config: RunnableConfig):
        system_prompt = """Bạn là trợ lý tiếp nhận yêu cầu của người dùng, hỗ trợ tư vấn Trường Đại học Công nghệ(UET or DHCN) mã trường là QHI. Hãy xử lý theo các bước sau:

1. XỬ LÝ CÁC TÌNH HUỐNG CHÀO HỎI/XÃ GIAO:
    - Khi người dùng chào hỏi hoặc hỏi thăm:
    - Trả lời một cách lịch sự bằng tiếng Việt.
    - Khi người dùng gửi câu hỏi chỉ mang tính chất giao tiếp, chào hỏi:
    - Đáp lại ngắn gọn, dựa trên kiến thức chung của bạn.
2. XỬ LÝ CÂU HỎI LIÊN QUAN ĐẾN UET, DHCN:

    - Khi người dùng yêu cầu thông tin chi tiết cần truy xuất từ hệ thống của trường, bao gồm nhưng không giới hạn:
    - Điểm chuẩn các năm
    - Chỉ tiêu tuyển sinh
    - Thông tin môn học
    - Số liệu thống kê
    - Ngành đào tạo
    - Thời gian học
    - Quy tắc:
    - Luôn ưu tiên trả lời "NEXT" trong trường hợp này để báo hiệu cần tìm kiếm thêm tài liệu.
3. XỬ LÝ CÂU HỎI KHÔNG LIÊN QUAN ĐẾN UET:

    - Nếu người dùng đề cập đến một trường đại học khác:
    - Trả lời: "tôi chỉ có thể trả lời các câu hỏi về uet".
    - LƯU Ý QUAN TRỌNG:
        + Ngày hiện tại: {current_date}
        + Chỉ sử dụng phản hồi "NEXT" khi cần tìm kiếm thêm tài liệu
        + Không tự ý bịa đặt số liệu hoặc thông tin mới
"""
        system_prompt = add_contact_info(system_prompt)
        
        history = state["history"]
        query = state["query"]
        
        current_date = datetime.now().date()
    
        messages = [SystemMessage(content=system_prompt.format(current_date=current_date))] + history + [HumanMessage(content=expand_abbreviations(query + "uet"))]
        message = await self.model.ainvoke(messages, config)
        flow_logger.info("____________________________________________________MANAGER_________________________________________")
        flow_logger.info(message)
        if message.content.lower().find("next") != -1:
            self.should_f_search = True
            return {
                "state_msg": "🕒 Xin hãy đợi chút, tôi đang tìm kiếm thông tin!\n\n",
                "state": "processing",
            }
        else:
            return {
                "state": "finished",
                "response": {
                    "answer": message.content,
                    "reference": {}
                }
            }
    
    async def manager_execute(self, state: AgentState, config: RunnableConfig):

        system_prompt = """Bạn là một người quản lý xử lý yêu cầu người dùng. Nhiệm vụ của bạn là đánh giá kho kiến thức có thể được sử dụng để trả lời yêu cầu từ người dùng hay không. 
                            Quy tắc:
                            - Trong trường hợp kho dữ liệu được coi là đủ, phản hồi với 'ANSWERABLE'.
                            - Ngược lại, phản hồi với 'NEXT'.
                            - Ngày hiện tại là {current_date}. Chú ý tới các thông tin nhạy cảm với thời gian. Đảm bảo rằng việc đánh giá cần xem xét kĩ lưỡng về mặt thời gian.
                            - Đặc biệt, với câu hỏi dạng liệt kê thông tin trong nhiều mốc thời gian, chỉ cần thiếu một mốc thời gian cần thiết, kho kiến thức sẽ bị coi là hoàn toàn không đầy đủ.
                        """


        history = state["history"]
        query = state["query"]
        kbinfos = state["kbinfos"]
        knowledges = [ck["content_with_weight"] for ck in kbinfos["chunks"]]
        current_date = datetime.now().date()
        # print(current_date)
        knowledge_context = "\n".join([f"- {k}" for k in knowledges]) if knowledges else "No relevant knowledge available."
        
        # Build message content
        human_content = f"Question: {expand_abbreviations(query)}\n\nContext Information:\n{knowledge_context}"
        
        messages = [
            SystemMessage(content=system_prompt.format(current_date=current_date)),
            *history,
            HumanMessage(content=human_content)
        ]
        message = await self.model.ainvoke(messages, config)
        
        
        
        flow_logger.info("____________________________________________________MANAGER_________________________________________")
        
        
        
        
        if message.content.lower().find("next") != -1:
            self.manager_retries += 1
            return {
                "state_msg": "🕒 Xin hãy đợi chút, tôi đang xử lý câu hỏi!\n\n",
                "state": "processing",
            }
        else:
        
            return {
                "state": "processing",
                "state_msg": "🕒 Xin hãy đợi chút, tôi đang tổng hợp câu trả lời!\n\n",
            }
    
    async def manager_answer_execute(self, state: AgentState, config: RunnableConfig):

        system_prompt = """You are a manager handling user queries. Use the provided relevant knowledge to answer the question. 
                        - Provide a detailed answer based on knowledge.
                        - Do not invent information not present in the knowledge.
                        - For numerical data or statistics, only use explicitly stated values from the knowledge.
                        - Maintain formal Vietnamese in responses when answering directly.
                        """

        system_prompt = add_contact_info(system_prompt)

        history = state["history"]
        query = state["query"]
        kbinfos = state["kbinfos"]
        knowledges = [ck["content_with_weight"] for ck in kbinfos["chunks"]]
        current_date = datetime.now().date()
        # print(current_date)
        knowledge_context = "\n".join([f"- {k}" for k in knowledges]) if knowledges else "No relevant knowledge available."
        
        # Build message content
        human_content = f"Question: {expand_abbreviations(query)}\n\nContext Information:\n{knowledge_context}"
        
        messages = [
            SystemMessage(content=system_prompt.format(current_date=current_date)),
            *history,
            HumanMessage(content=human_content)
        ]
        message = await self.model.ainvoke(messages, config)
        
        
        
        flow_logger.info("_____________________________________________MANAGER_ANSWER_________________________________________")
        
        
        
        answer = decorate_answer(message.content, kbinfos, self.embd_mdl, self.dialog.vector_similarity_weight)
        return {
            "state": "finished",
            "response": answer
        }
    
    async def f_search(self, state: AgentState):
        query = state["query"]
        ranks = state.get("kbinfos", {"total": 0, "chunks": [], "doc_aggs": []})
        ranks["doc_aggs"] = {}
        
        kbinfos = retrievaler.retrieval(
            query, self.embd_mdl, self.dialog.tenant_id, self.dialog.kb_ids, 1, self.dialog.top_n,
            self.dialog.similarity_threshold, self.dialog.vector_similarity_weight,
                doc_ids=None, top=self.dialog.top_k, aggs=False, rerank_mdl=None
        )
        ranks["total"] += kbinfos["total"]
        for ck in kbinfos["chunks"]:
            if ck["chunk_id"] not in [c["chunk_id"] for c in ranks["chunks"]]:
                ranks["chunks"].append(ck)
        kbinfos = retrievaler.retrieval(
            query, self.embd_mdl, self.dialog.tenant_id, self.dialog.kb_ids, 1, self.dialog.top_n,
            self.dialog.similarity_threshold, self.dialog.vector_similarity_weight,
                doc_ids=None, top=self.dialog.top_k, aggs=False, rerank_mdl=None, external_source=True
        )
        ranks["total"] += kbinfos["total"]
        for ck in kbinfos["chunks"]:
            if ck["chunk_id"] not in [c["chunk_id"] for c in ranks["chunks"]]:
                ranks["chunks"].append(ck)
        ranks = rerank_results(query, ranks, self.dialog, 4, self.rerank_mdl)
        
        flow_logger.info("____________________________________________________F_SEARCH____________________________________")
        
        
        return {
            "kbinfos": ranks,
            "state": "processing",
            "state_msg": "🔄 Đang phân tích dữ liệu"
        }
        
    def cleaner_execute(self, state: AgentState):      
        prompt_system = """
            Bạn là một người đảm nhận việc tiền xử lý truy vấn của người dùng. Nhiệm vụ của bạn là xử lý truy vấn trong các trường hợp sau rồi đưa ra truy vấn sau khi chính sửa.
            - Sửa các lỗi chính tả có trong truy vấn.
            - Loại bỏ các kí tự đặc biệt không cần thiết trong truy vấn.
            - Nếu truy vấn không đề cập tới bất kì mốc thời gian cụ thể nào, viết lại truy vấn đó theo dạng liệt kê thông tin 'trong những năm gần đây'.
        """
        
        query = state["query"]
        
        messages = [SystemMessage(content=prompt_system)] + [HumanMessage(content=expand_abbreviations(query))]
        response_message = self.model.invoke(messages)
        # print(response_message.content)
        
        flow_logger.info("____________________________________________________CLEANER____________________________________")
        
        return { 
                "state_msg": "🔍 Đang phân tích câu hỏi...\n\n",
                "query": response_message.content,
                "state": "processing"
            }
    
    def analyzer_execute(self, state: AgentState):
        # print("*** CALL ANALYZER AGENT ***")
        
        prompt_system = (           
            """
            Bạn là một người phân tích truy vấn người dùng. Nhiệm vụ của bạn là phân tích truy vấn của người dùng thành những câu nhỏ hơn (tức là những câu hỏi cần phải được trả lời thì mới có được câu trả lời cho truy vấn của người dùng).
            Để làm được điều đó, bạn cần phải:
            - Xác định rõ yêu cầu của truy vấn từ người dùng rồi phân tách ra thành các câu hỏi nhỏ hơn.
            - Làm rõ câu hỏi dựa trên lịch sử chat nếu chúng liên quan tới nhau.
            - Chú ý đến từng câu chữ trong truy vấn để có đƯợc đầy đủ thông tin cần thiết cho từng câu hỏi nhỏ.
            - Các câu hỏi nhỏ cần liên quan chặt chẽ tới câu hỏi chính, không lan man quá rộng.
            - Sinh ra đối tượng JSON bao gồm câu hỏi các câu hỏi nhỏ được phân tích từ truy vấn của người dùng. Đầu ra cần được viết bằng tiếng Việt, không phải tiếng Anh.
            Chú ý:
            - Thời gian hiện tại là: {current_date}. Chú ý đến các thông tin liên quan tới thời gian. Chú ý mốc thời gian hiện tại.
            """
        )

        query = state["query"]
        history = state["history"]
        current_date = datetime.now().date()
        analyst_reflection = state['analyst_reflection'] if 'analyst_reflection' in state else []
        messages = [SystemMessage(content=prompt_system.format(current_date=current_date))] + history + analyst_reflection + [HumanMessage(content=query)]
        response_message = self.model.with_structured_output(Queries).invoke(messages)
        flow_logger.info("___________________________________________________ANALYZER_________________________________________________")
        flow_logger.info(response_message)
        # print(response_message.questions)
        return {"search_query": response_message,
                "merged_query": query,
                "state_msg": "📚 Đang tìm kiếm dữ liệu trong kho kiến thức...\n\n",
                "state": "processing"
            }
    
    def reflection_execute(self, state: AgentState):
        # print("*** CALL REFLECTION AGENT ***")
        
        system_prompt = """
            You are a reflection agent. Your task is to evaluate the user question analysis results from AnalystAgent and provide additional questions. Specifically, your task includes:
            - Carefully review the list of questions analyzed by AnalystAgent, paying particular attention to the 'target' of the question, as well as the context and keywords.
            - Assess whether the list is 'sufficient' and 'detailed.' A list of questions is considered sufficient if it adequately covers the intent of the user's original input question.
            - If the list of questions is sufficient, set 'enough' = true and do not ask any additional questions (leave additional_questions EMPTY). Otherwise, set 'enough' = false and propose questions to help AnalystAgent fully cover the intent of the user's original question.
            - The additional questions must closely align with the 'target' of the original question and avoid straying into extraneous or supplementary information. Be stick to the target (objectives) of the first question (original user's question). Do not ask questions about the user's information or incomplete/unspecified details in the question unless those are the primary intent of the user's original question.
            For example, if information about time, a specific address or a specific object is missing or unidentified, do not ask questions to clarify it. Instead, assume that such information is already available and general and focus on formulating questions aligned with the objective of the original question.
            For example, if the user asks a question about 'The company's salary policy?' and the 'company' is not specified, assume it refers to a general company and do not attempt to clarify it.
            - Addition to the reflected questions, you also ask any extending questionss. To do that, follow these steps:
                + Identify the keywords in the question.
                + Find synonyms for these keywords.
                + Replace the keywords in the original question with their synonyms to generate extending questions.
                + Each keywords should be replaced at least one time.
            
        """
        self.reflect_retries += 1
        query = state["query"]
        search_query = state["search_query"]
        messages = [SystemMessage(content=system_prompt)] + [HumanMessage(content=query)] + [HumanMessage(content=search_query)]
        response_message = self.model.with_structured_output(Reflection_Queries).invoke(messages)
        json_response = json.loads(response_message.content)
        if 'additional_questions' in json_response and json_response['additional_questions']:
            response_message.content = "Reflection Questions: " + " ".join(json_response['additional_questions'])
        else:
            response_message.content = "[]"

        if json_response['enough']:
            self.retries = self.MAX_RETRIES    
            
        reflection = state['analyst_reflection'] if 'analyst_reflection' in state else []
        reflection.append(HumanMessage(content=response_message.content))
        
        return {"analyst_reflection": reflection, "state": "processing"}
        
    def searcher_execute(self, state: AgentState):
        # print("*** CALL SEARCHER AGENT ***")


        questions = state["search_query"].questions
        ranks = state.get("kbinfos", {"total": 0, "chunks": [], "doc_aggs": []})
        ranks["doc_aggs"] = {}
        threads = []
        lock = threading.Lock()
        kbs = KnowledgebaseService.get_by_ids(self.dialog.kb_ids)
        is_kg = all([kb.parser_id == ParserType.KG for kb in kbs])
        retr = retrievaler if not is_kg else kg_retrievaler
        def retrieval(query: str, external_source=False):
            kbinfos = retr.retrieval(
                query, self.embd_mdl, self.dialog.tenant_id, self.dialog.kb_ids, 1, self.dialog.top_n,
                self.dialog.similarity_threshold, self.dialog.vector_similarity_weight,
                doc_ids=None, top=self.dialog.top_k, aggs=False, rerank_mdl=None, external_source=external_source
            )
            with lock:
                ranks["total"] += kbinfos["total"]
                for ck in kbinfos["chunks"]:
                    if ck["chunk_id"] not in [c["chunk_id"] for c in ranks["chunks"]]:
                        ranks["chunks"].append(ck)
        for question in questions[:4]:
            thread1 = threading.Thread(target=retrieval, args=(question,))
            threads.append(thread1)
            thread1.start()
        for thread in threads:
            thread.join()
        ranks = rerank_results(state["merged_query"], ranks, self.dialog, 10, self.rerank_mdl)
        if self.validate_retries >= self.MAX_RETRIES:
            return {"kbinfos": ranks, 
                    "state_msg": "📝 Đang tạo câu trả lời dựa trên dữ liệu tìm kiếm được...\n\n",
                    "state": "generating"}
        return {"kbinfos": ranks, 
                "state_msg": "🔄 Đang kiểm tra lại dữ liệu...\n\n",
                "state": "processing"}

    def validator_execute(self, state: AgentState):
        self.validate_retries += 1
        
        system_prompt = """Bạn là validator thông minh. Nhiệm vụ của bạn là đánh giá xem các thông tin hiện tại ĐÃ ĐỦ để trả lời câu hỏi chưa.       
        Quy tắc:
        - Chú ý đến mục tiêu chính của câu hỏi để đánh giá chính xác về mặt ngữ nghĩa.
        - Ngày hiện tại là {current_date}. Chú ý tới các thông tin nhạy cảm với thời gian. Đảm bảo rằng việc đánh giá cần xem xét kĩ lưỡng về mặt thời gian, với thời gian hiện tại là mốc.
        - Đặc biệt, với câu hỏi dạng liệt kê thông tin trong nhiều mốc thời gian, chỉ cần thiếu một mốc thời gian cần thiết, thông tin sẽ bị coi là không đầy đủ.
        - Chỉ ra là thông tin hiện tại là đủ hay không đủ. Nếu thông tin này là không đủ, chỉ ra những phần còn thiếu trong kho kiến thức. Output cần đầy đủ, chi tiết.
        """
        
        query = state["query"]
        kbinfos = state["kbinfos"]
        knowledges = [ck["content_with_weight"] for ck in kbinfos["chunks"]]
        current_date = datetime.now().date()
        
        messages = [
            SystemMessage(content=system_prompt.format(current_date=current_date)),
            HumanMessage(content=f"Câu hỏi: {query}"),
            HumanMessage(content=f"Thông tin hiện có:\n{'- '.join(knowledges)}")
        ]
        
        try:
            response = self.model.with_structured_output(Validator_Evaluation).invoke(messages)
        except:
            response = Validator_Evaluation(enough=True, reason=[])
        
        flow_logger.info("___________________________________________________VALIDATOR_________________________________________________")
        flow_logger.info(response)
        
        if response.enough:
            self.should_search_again = False
            return {
                "state_msg": "✅ Dữ liệu đủ, đang tạo câu trả lời...\n\n",
                "state": "generating"
            }
        
        return {
            "search_feedback": response.reason,
            "state_msg": "🔎 Đang tìm kiếm thêm thông tin...\n\n",
            "state": "processing"
        }
        
    def search_reflector_execute(self, state: AgentState):
        system_prompt = """Bạn là trợ lý thông minh. Nhiệm vụ của bạn là đề xuất chỉ 1 đến 2 câu hỏi tìm kiếm BỔ SUNG ngắn gọn tập trung vào những thông tin còn thiếu.       
        Quy tắc:
        - Mỗi câu hỏi chỉ nên phục vụ cho việc tìm kiếm một thông tin đơn lẻ. Vì vậy, hay tách chúng ra nếu quá lớn.
        - Không đề xuất câu hỏi trùng với câu hỏi gốc.
        - Chỉ trả về JSON với 1 trường supporting_questions (array).
        - Câu hỏi cần ngắn gọn, tập trung vào thông tin cụ thể còn thiếu.
        - Luôn dùng Tiếng Việt.
        """
        
        query = state["query"]
        search_feedback = state["search_feedback"]
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Câu hỏi: {query}"),
            HumanMessage(content=f"Thông tin còn thiếu:\n{'- '.join(search_feedback)}")
        ]
        
        try:
            response = self.model.with_structured_output(Validator_Queries).invoke(messages)
        except:
            response = Validator_Queries(supporting_questions=[])
        flow_logger.info("___________________________________________________SEARCH_REFLECTOR_________________________________________________")
        flow_logger.info(response)

        validate_queries = Validate_Queries(enough=False, questions=response.supporting_questions)
        
        new_merged_query = " ".join(response.supporting_questions) + " " + state['merged_query']
            
        return {
            "search_query": validate_queries,
            "merged_query": new_merged_query,
            "state_msg": "🔎 Đang tìm kiếm thêm thông tin...\n\n",
            "state": "processing"
        }
    

    async def answer_execute(self, state: AgentState, config: RunnableConfig):
        # print("*** CALL ANSWER AGENT ***")
        
        system_prompt = """You are an intelligent assistant. Your task is to answer the user's questions based on the knowledge obtained from the knowledge base (Provided Knowledges). To achieve this, follow these steps:
            - Summarize the content of the knowledge base to thoroughly understand the knowledges.
            - Pay attention to the details and meanings in the question to provide a comprehensive and thorough response.
            - Extract all useful information that support for answering the user's questions.
            - Compose the answer based on useful information. Your response should also take the chat history into account.
            
            Note: Do not use your own knowledge to answer the questions, please use the provided knowledge base. 
            
            Below is the knowledge base:
            {knowledge}
            This is the knowledge base.
            """
            
        system_prompt = add_contact_info(system_prompt)

        query = state["query"]
        kbinfos = state["kbinfos"]
        knowledges = [ck["content_with_weight"] for ck in kbinfos["chunks"]]
        
        history = state["history"]
        messages = [SystemMessage(content=system_prompt.format(knowledge="\n\n\n".join(knowledges)))] + history + [HumanMessage(content=query)]
        # message = await self.model.with_structured_output(Potential_Answer).ainvoke(messages, config)
        message = await self.model.ainvoke(messages, config)
        
        
        # if len(message.useful_information) > 0:
        #     answer = decorate_answer(message.proposed_answer)
        # else:
        #     answer = 'Không tìm thấy câu trả lời mà bạn muốn trong kho kiến thức!'
        answer = decorate_answer(message.content, kbinfos, self.embd_mdl, self.dialog.vector_similarity_weight)
        return {"response": answer,
                "state": "finished"}
    
import asyncio
import unicodedata

def clean_text(text: str) -> str:
    # Cách 1: Normalize về dạng NFKC
    normalized = unicodedata.normalize("NFKC", text)
    # Cách 2: Nếu vẫn có lỗi, bạn có thể thay thế các ký tự không encode được:
    cleaned = normalized.encode("utf-8", "replace").decode("utf-8")
    return cleaned

async def main():
    question = input("Question: ")
    question = clean_text(question)
    dialog_id = "dbc71792e14411efb7b50242ac110007"
    e, dialog = DialogService.get_by_id(dialog_id)
    workflow = AgentWorkFlow(dialog)
    async for _, msg in workflow.graph.astream({"messages": [], "history": [], 
                                "query": question}, stream_mode=["messages", "updates"]):
        if type(msg) == tuple:
            print(msg[0].content, end="")
            if msg[0].content.strip().lower() == "next":
                continue
        else:
            first_key = next(iter(msg))
            obj = msg[first_key]
            state = obj.get("state")
            if state=="finished":
                print(obj["response"]["answer"])
            elif state=="generating":
                print("He he")
            else:
                # print("ready")
                state_msg = obj.get("state_msg", "No state_msg found")  # Sử dụng get để tránh lỗi KeyError
                print(state_msg)

if __name__ == '__main__':
    asyncio.run(main())