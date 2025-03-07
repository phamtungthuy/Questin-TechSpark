from agent.agent_base import Agent, AgentState
from langchain_core.messages import AnyMessage
from langgraph.graph import StateGraph
import os
import pickle as pkl

current_dir = os.path.dirname(os.path.abspath(__file__))

class LongTermMemoryAgent(Agent):
    def __init__(self, model, session_id, system=None):
        
        # TODO: Set up short term, long term, self reflection and summarizer node for graph
        self.session_id = session_id
        self.long_term_memory_addr = f"{current_dir}/long_term/{self.session_id}/"
        
        os.makedirs(self.long_term_memory_addr, exist_ok=True)
        
        self.current_id = 0
        graph = StateGraph(AgentState)
        graph.add_node("long_term_mem", self.execute)
        graph.set_entry_point("long_term_mem")
        self.model = model
        self.graph = graph.compile()
        
    def call_llm(self, state: AgentState):
        pass
    
    def save_to_db(self, data: list[AnyMessage]):
        
        # Sample save data to external folder
        addr = f"{self.long_term_memory_addr}conversation{str(self.current_id)}.pkl"
        
        with open(addr, 'wb') as file:
            pkl.dump(data, file)
            
        # TODO: save to db
        
        return True

    def execute(self, state: AgentState):
        
        messages = state['messages']
        
        for message in messages:
            if "question" in message.content and "answer" in message.content:
                self.save_to_db(message)
                self.current_id += 1
        
        return {
            "messages": []
        }
        
    def take_action(self, state: AgentState):
        pass
    
    @staticmethod
    def get_latest_mem(session_id: str, max_conversations: int):
        addr = f"{current_dir}/long_term/{session_id}"
        
        files = [f for f in os.listdir(addr) if os.path.isfile(os.path.join(addr, f))]
        
        mem = []
        
        start_idx = max(0, len(files) - max_conversations)
        
        for file_path in files[start_idx:]:
            
            path = f"{addr}/{file_path}"
            
            with open(path, "rb") as file:
                messages = pkl.loads(file.read())
                
            mem.append(messages)
            
        return mem