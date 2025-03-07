from abc import ABC, abstractmethod
from typing import TypedDict, Annotated
from langchain_core.messages import ToolMessage, AnyMessage, SystemMessage
import operator
import logging

class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    knowledges: list[str]
    query: AnyMessage
    cleaned_query: AnyMessage
    analyst_reflection: list[AnyMessage]
    history: list[AnyMessage]
    tool_calls: AnyMessage
    search_query: any
    dialog_id: str
    retries: int

class Agent(ABC):
    system = """You are a smart research assistant. Use the search engine to look up information. \
You are allowed to make multiple calls (either together or in sequence). \
Only look up information when you are sure of what you want. \
If you need to look up some information before asking a follow up question, you are allowed to do that!
"""
    model = None
    graph = None
    tools = {}
        
    def call_llm(self, state: AgentState):
        messages = state['messages']
        if self.system:
            messages = [SystemMessage(content=self.system)] + messages
        message = self.model.invoke(messages)
        return {'messages': [message]}
    
    def exists_action(self, state: AgentState):
        result = state["messages"][-1]
        try:
            tool_calls = result.tool_calls
        except:
            tool_calls = []
        return len(tool_calls) > 0
    
    def take_action(self, state: AgentState):
       
        tool_calls = state['messages'][-1].tool_calls
        results = []
        for t in tool_calls:
            print(f"Calling: {t}")
            if not t['name'] in self.tools:      # check for bad tool name from LLM
                print("\n ....bad tool name....")
                result = "bad tool name, retry"  # instruct LLM to retry if bad
            else:
                result = self.tools[t['name']].invoke(t['args'])
            results.append(ToolMessage(tool_call_id=t['id'], name=t['name'], content=str(result)))
        print("Back to the model!")
        return {'messages': results}
    
    def execute(self, state: AgentState):
        result = self.graph.invoke(state)
        return result
    
    def execute_response_only(self, state: AgentState):
        messages = state["messages"]
        return_idx = len(messages)
        result = self.graph.invoke(state)
        result["messages"] = result["messages"][return_idx:]
        
        return result