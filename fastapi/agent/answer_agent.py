from agent.agent_base import Agent, AgentState
from langchain_core.messages import SystemMessage, ToolMessage, AIMessage, HumanMessage
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph
from db.settings import retrievaler
import json

RETRIES_TIME = 3

class Potential_Answer(BaseModel):
    paraphrased_questions: str = Field(description="An array of paraphrased versions of user's question.")
    useful_information: str = Field(description="All extracted useful information from knowledge base that could use to answer user's questions or its paraphrased versions (questions in `paraphrased_questions` field).")
    proposed_answer: str = Field(description="Answer composed from `useful_information` fields. Your response should also take the chat history into account.")

class AnswerAgent(Agent):
    def __init__(self, model, tools, system=None):
        if not system:
            # system = "You are a smart answer assitant."
    #         system = """Bạn là một trợ lý thông minh, hãy tóm tắt nội dung của kho kiến thức để trả lời câu hỏi, vui lòng liệt kê dữ liệu trong kho kiến thức để trả lời chi tiết và đầy đủ. Khi tất cả nội dung của kho kiến thức đều không liên quan đến câu hỏi, câu trả lời của bạn phải bao gồm câu “Không tìm thấy câu trả lời mà bạn muốn trong kho kiến thức!”. Câu trả lời cần cân nhắc đến lịch sử trò chuyện.
    # Dưới đây là kho kiến thức:
    # {knowledge}
    # Đây là kho kiến thức."""
            system = """You are an intelligent assistant. Your task is to answer the user's questions based on the knowledge obtained from the knowledge base (Provided Knowledges). To achieve this, follow these steps:
            - Summarize the content of the knowledge base to thoroughly understand the knowledges.
            - Pay attention to the details and meanings in the question to provide a comprehensive and thorough response.
            - Extract all useful information that support for answering the user's questions.
            - Compose the answer based on useful information. Your response should also take the chat history into account.
            
            Note: Do not use your own knowledge to answer the questions, please use the provided knowledge base. 
            
            Below is the knowledge base:
            {knowledge}
            This is the knowledge base.
            """
        self.system = system
        graph = StateGraph(AgentState)
        graph.add_node("llm", self.call_llm)
        graph.set_entry_point("llm")
        self.model = model
        self.graph = graph.compile()
        
    def call_llm(self, state: AgentState):
        query = state["query"]
        knowledges = state["knowledges"]
        
        history = state["history"]
        
        # for docs in knowledges:
        #     print("*** DOCUMENTS ***")
        #     print(docs)
        # print(knowledges)
        if self.system:
            messages = [SystemMessage(content=self.system.format(knowledge=knowledges))] + history[-6:] + [query]
            
        answers = []
            
        for i in range(0, RETRIES_TIME):    
            message = self.model.with_structured_output(Potential_Answer).invoke(messages)
            answers.append(message)
            
        sync_message = self.sync_answer(answers, query.content)
            
        return {"messages": [sync_message]}

    def sync_answer(self, answers: list, query: str):
        system = """You are responsible for consolidating responses from AnswerAgent. 
        Your task is to choose the most reasonable answer to the user's query in the responses list obtained from AnswerAgent. 
        Ensure that the provided final answer is the best possible one. 
        Only select relevant answers, keep them intact, and do not generate any additional information. 
        If no suitable answer is found, the final answer MUST include: 'Không tìm thấy câu trả lời mà bạn muốn trong kho kiến thức!'.
        """
        
        messages = [SystemMessage(content=system)] + [query] + [HumanMessage(content=str(answers))]
            
        answer = self.model.invoke(messages)
        
        non_empty_useful_info = 0
        
        for ans in answers:
            
            useful_info = ans.useful_information           
            if len(useful_info) > 0:
                non_empty_useful_info += 1
                
        if not non_empty_useful_info:
            answer.content = 'Không tìm thấy câu trả lời mà bạn muốn trong kho kiến thức!'
            
        return answer

        

    def take_action(self, state: AgentState):
        pass
    
    def insert_citations(self, state: AgentState):
        pass