from agent.agent_base import Agent, AgentState
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph

from agent.memory.summarizer import SummarizerAgent
from agent.memory.short_term_memory import ShortTermMemoryAgent
from agent.memory.self_reflection import ReflectionAgent
from agent.memory.answer_reflection import AnswerReflectionAgent
from agent.memory.long_term_memory import LongTermMemoryAgent

class MemoryAgent(Agent):
    def __init__(self, model, session_id, system=None):
        
        # TODO: Set up short term, long term, self reflection and summarizer node for graph
        self.session_id = session_id
        summarizer = SummarizerAgent(model, [], session_id)
        short_term_mem = ShortTermMemoryAgent(model, session_id, [])
        reflection_agent = ReflectionAgent(model, [])
        answer_agent = AnswerReflectionAgent(model, [])
        long_term_mem = LongTermMemoryAgent(model, session_id, [])
        graph = StateGraph(AgentState)
        graph.add_node("memory", self.execute)
        graph.add_node("summarizer", summarizer.execute_response_only)
        graph.add_node("short_term_mem", short_term_mem.execute_response_only)
        graph.add_node("reflection", reflection_agent.execute_response_only)
        graph.add_node("answer", answer_agent.execute_response_only)
        graph.add_node("long_term_mem", long_term_mem.execute_response_only)
        graph.add_edge("memory", "summarizer")
        graph.add_edge("summarizer", "short_term_mem")
        graph.add_edge("short_term_mem", "reflection")
        graph.add_edge("reflection", "answer")
        graph.add_edge("answer", "long_term_mem")
        graph.set_entry_point("memory")
        self.model = model
        self.graph = graph.compile()
        
    def call_llm(self, state: AgentState):
        pass

    def execute(self, state: AgentState):
        return {
            'messages': []
        }

    def take_action(self, state: AgentState):
        pass
    
    @staticmethod
    def get_latest_short_term_mem(session_id: str, max_conversations: int):
        return ShortTermMemoryAgent.get_latest_mem(session_id, max_conversations)
        
    @staticmethod
    def get_latest_long_term_mem(session_id: str, max_conversations: int):
        return LongTermMemoryAgent.get_latest_mem(session_id, max_conversations)
        
    