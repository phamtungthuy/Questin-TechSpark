from agent.agent_base import Agent, AgentState
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph

from langchain_openai import ChatOpenAI
import pickle as pkl

from agent.memory.answer_reflection import AnswerReflectionAgent
from agent.memory.long_term_memory import LongTermMemoryAgent

class ReflectionAgent(Agent):
    def __init__(self, model, tools, system=None):
        if not system:
            system = """
            "You are a smart questioner."
            "After the system answers a question, your task is to read PREVIOUS STEPS (PROVIDED INFORMATION) and ask additional questions RELATED to them to REFLECT on what the system has just done.\n"
            "Your input includes a summary of interactions between the user and the system, including the Question, Response, Essential Information, and Source."
            "The scope of the questions should be close to the provided information, without straying too far into unrelated topics."
            "Stick to the provided information. Avoid questions that offer PERSONAL OPINIONS."
            "A maximum of 2 questions. Do not answer the questions."
            "Result MUST be in JSON format."
            "{
                "questions": {
                    "question-1": .....,
                    "question-2": .....
                }
            }"
            """
        self.system = system
        answer = AnswerReflectionAgent(model, [])
        graph = StateGraph(AgentState)
        graph.add_node("llm", self.call_llm)
        # graph.add_node("answer", answer.execute_response_only)
        # graph.add_edge("llm", "answer")
        graph.set_entry_point("llm")
        self.model = model
        self.graph = graph.compile()
        
    def call_llm(self, state: AgentState):
        
        print("************************************")
        print("CALL TO REFLECTION_AGENT")
        print("************************************")
        
        messages = state['messages'][:-1]
        
        if self.system:
            messages = [SystemMessage(content=self.system)] + messages
        message = self.model.invoke(messages)
    
        return {"messages": [message]}

    def take_action(self, state: AgentState):
        pass
    