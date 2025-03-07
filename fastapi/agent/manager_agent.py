import sys
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from agent.agent_base import Agent, AgentState
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.types import Command
from dotenv import load_dotenv
from agent.search_agent import SearchAgent
from agent.answer_agent import AnswerAgent
from agent.memory.memory import MemoryAgent
from agent.tools.retrieval import Retrieval
from agent.memory.summarizer import SummarizerAgent
from agent.memory.self_reflection import ReflectionAgent
from agent.analyst_agent import AnalystAgent
from agent.tools.retrieval import Retrieval
from agent.search_reflector_agent import SearchReflectorAgent
from agent.tools.duckduckgo import DuckDuckGo
import pickle as pkl

load_dotenv()



class ManagerAgent(Agent):
    def __init__(self, model, tools, dialog_id="", system=None):
        members =['searcher']
        if not system:    
            system = """You are a manager handling user queries. Analyze each question to determine if it can be answered using internal knowledge, history, or memory. If confident, respond directly. If external resources are required, reply with 'NEXT'. Ensure responses are concise, relevant, and professional."""

        dialog_id = dialog_id
        self.system = system
        self.session_id = "test-02"

        self.should_continue = False
        retrieval = Retrieval(dialog_id=dialog_id)
        duckduckgo = DuckDuckGo()
        self.analyzer = AnalystAgent(model, [])
        searcher = SearchAgent(model, [retrieval], dialog_id)

        answerer = AnswerAgent(model, [])
        memory = MemoryAgent(model, self.session_id, [])
        search_reflector = SearchReflectorAgent(model, [])
        graph = StateGraph(AgentState)
        # graph.add_node("llm", self.execute)
        graph.add_node("analyzer", self.analyzer.execute_response_only)
        graph.add_node("searcher", searcher.execute_response_only)
        graph.add_node("answer", answerer.execute_response_only)
        graph.add_node("memory", memory.execute_response_only)
        graph.add_node("search_reflector", search_reflector.execute_response_only)
        graph.add_edge("analyzer", "searcher")
        graph.add_conditional_edges("searcher", self.should_search_again, {True: "search_reflector", False: "answer"})
        graph.add_conditional_edges('search_reflector', self.should_search_again, {True: "searcher", False: "answer"})
        
        # graph.add_edge("answer", "memory")
        # graph.add_conditional_edges("llm", self.get_should_continue,
        #                             {True: "analyzer", False: END})
        # graph.set_entry_point("llm")
        graph.set_entry_point("analyzer")
        self.graph = graph.compile()
        self.tools = {t.name: t for t in tools}
        self.model = model
        self.retries = 0
        
    def should_search_again(self, state: AgentState):
        self.retries += 1
        if self.retries > 2:
            return False
        return True
    
    def get_should_continue(self, state: AgentState):
        return self.should_continue
    
    def execute(self, state: AgentState):
        history = state['history']
        query = state["query"]
        if self.system:
            messages = [SystemMessage(content=self.system)] + history + [query]
        
        message = self.model.invoke(messages)
        if message.content.lower().find("next") != -1:
            self.should_continue = True
            return {
                "messages": [
                    AIMessage(content="Xin hãy đợi chút, tôi đang tìm kiếm những thông tin liên quan!")
                ]
            }
        return {
            "messages": [message]
        }
    
if __name__ == '__main__':
    model = ChatOpenAI(
        # api_key="123",
        # base_url="http://27.65.59.245:54354/v1", # This is the default and can be omitted,
        # model="cognitivecomputations/Dolphin3.0-Llama3.2-3B"
        model="gpt-4o-mini"
    )
    dialog_id = "090f7eeee08011ef964f0242ac110007"
    manager = ManagerAgent(model, [], dialog_id)
    question = input("Question: ")
    query = HumanMessage(content=question)    
    for e in manager.graph.stream({"messages": [], "history": [], "query": query, "dialog_id": dialog_id}):
        for v in e.values():
            messages = v["messages"]
            for message in messages:
                
                # if type(message) == AIMessage:
                    print("*** FINAL ANSWER ***")
                    print(message.content)
    # result = manager.graph.stream({"messages": messages})
    # for message in result["messages"]:
    #     print(message.content)
