from agent.agent_base import Agent, AgentState
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph
import pickle
import json

class AnswerReflectionAgent(Agent):
    def __init__(self, model, tools, system=None):
        if not system:
            system = """
            You are a smart answer assitant. Based on the related information, answer questions in json format:
            {
                "question": ...,
                "answer": ...
            }
            The answer should be in form of paragraph.  
            """ 
        self.system = system
        graph = StateGraph(AgentState)
        graph.add_node("llm", self.call_llm)
        graph.set_entry_point("llm")
        self.model = model
        self.graph = graph.compile()
        
    def call_llm(self, state: AgentState):
        messages = state['messages']
        
        start = messages[-1].content.find('{')
        end = messages[-1].content.rfind('}')

        questions = json.loads(messages[-1].content[start:end+1])

        qa_pairs = []
        
        for question in questions['questions'].values():
            messages_clone = messages[:-2]
            messages_clone[0] = HumanMessage(content=question)
            
            if self.system:
                messages_clone = [SystemMessage(content=self.system)] + messages_clone
            
            message = self.model.invoke(messages_clone)
            qa_pairs.append(message)
            
        return {"messages": qa_pairs}

    def take_action(self, state: AgentState):
        pass
    