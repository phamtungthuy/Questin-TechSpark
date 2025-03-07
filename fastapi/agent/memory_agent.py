import os
import getpass
from agent.agent_base import Agent, AgentState
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from pydantic import BaseModel, Field
import operator
import json
load_dotenv()


class MemoryAgent(Agent):

    def __init__(self, model, system=None):
        if not system:
            system = (
                """
                You are a conversation summary agent designed to help maintain and summarize the context of ongoing interactions. Your tasks include:
                - Updating context with new information while ensuring older irrelevant details are pruned.
                - Summarizing the most recent exchanges in a concise and clear manner, to only a message.
                - Combine the context of old summarized history with new messages.
                - Include as many specific details as you can.
                
                Here is old summarized history:
                {summarized_history}
                """
            )
    

        self.system = system
        self.model = model

        graph = StateGraph(AgentState)
        graph.add_node("llm", self.call_llm)
        graph.set_entry_point("llm")
        self.graph = graph.compile()

    def call_llm(self, state: AgentState):
                
        
        old_summarized_history = state['summarized_history']
        query = state["query"]
        
        if self.system:
            messages = [SystemMessage(content=self.system.format(summarized_history = old_summarized_history))] + [query]
            
        new_summarized_history = self.model.invoke(messages)    
        return {"sumarized_history": new_summarized_history}

    def take_action(self, state: AgentState):
        """
        Placeholder for additional actions based on state. (Currently unused)

        Args:
            state (AgentState): The current state of the agent.
        """
        pass

if __name__ == '__main__':
    pass