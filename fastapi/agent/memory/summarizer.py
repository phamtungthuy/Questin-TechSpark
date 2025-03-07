from agent.agent_base import Agent, AgentState
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph

from langchain_openai import ChatOpenAI
from agent.memory.short_term_memory import ShortTermMemoryAgent
import pickle as pkl

class SummarizerAgent(Agent):
    def __init__(self, model, tools, session_id, system=None):
        if not system:
            system = """
            "You are a smart information summarizer. Your input is a set of messages consisting of the interaction steps between the User and System, including:\n"
            "- Questions from the user: First message.\n"
            "- Information related to the question, along with corresponding sources: Subsequent messages.\n"
            "- The final response from system: Last message. \n"
            "Addition to current interaction step, you also receive the summarization of the previous step. "
            "Your task is to summarize the important information during the interaction between the User and System, including four main sections: Question, Response, Essential Information and Source. For Essential Information, you could summarize related information based on EACH of the middle messages."
            "For Response, you should summarize information from last message"
            "Summarizations should be in the form of paragraphs, at least  lines. The output should be returned in JSON format.\n"
            "Example format: \n"
            "{
                'Question': ...,    
                'Response': ...,
                'Essential Information': ...,
                'Source': ...
            }'"
            """
        self.system = system
        self.session_id = session_id
        graph = StateGraph(AgentState)
        graph.add_node("llm", self.call_llm)
        graph.set_entry_point("llm")
        self.model = model
        self.graph = graph.compile()
        
    def call_llm(self, state: AgentState):
        
        print("************************************")
        print("CALL TO SUMMARIZER")
        print("************************************")
        
        messages = state['messages'][:-1]
        
        # add previous step's summarization
        latest_mem = ShortTermMemoryAgent.get_latest_mem(session_id=self.session_id, max_conversations=1)
        
        if latest_mem:
            prev_sum = latest_mem[0][-1]
            
            prev_sum.content = "Previous step's summarization:\n" + prev_sum.content
            
            messages = [prev_sum] + messages
        
        if self.system:
            messages = [SystemMessage(content=self.system)] + messages
        message = self.model.invoke(messages)
                
        return {"messages": [message]}

    def take_action(self, state: AgentState):
        pass
    