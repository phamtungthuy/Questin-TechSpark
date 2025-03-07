from agent.agent_base import Agent, AgentState
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from agent.tools.retrieval import Retrieval, retrievaler
from agent.tools.duckduckgo import DuckDuckGo
from db.db_services.dialog_service import DialogService
from db.db_services.llm_service import LLMBundle
from db.constants import LLMType
from dotenv import load_dotenv
import threading

load_dotenv()

class SearchAgent(Agent):
    def __init__(self, model, tools, dialog_id, system=None):
        if not system:
            if not system:
                system = f"""You are a smart research assistant. You have access to multiple tools to search for information.  
Your task is to determine the best course of action based on the following rules:  

1. If there are unused tools with potential to help, select the most appropriate tools for each query and use them to perform searches. Each question in the input corresponds to a query, and use all of those questions.
"""

        self.system = system
        
        e, dialog = DialogService.get_by_id(dialog_id)
        self.dialog = dialog
        self.rerank_mdl = None
        if dialog.rerank_id:
            self.rerank_mdl = LLMBundle(dialog.tenant_id, LLMType.RERANK, dialog.rerank_id)
        
        graph = StateGraph(AgentState)
        graph.add_node("llm", self.call_llm)
        graph.add_node("action", self.take_action)
        graph.add_node("rerank", self.rerank)
        graph.add_conditional_edges(
            "llm",
            self.exists_action,
            {True: "action", False: END}
        )
        graph.set_entry_point("llm")
        graph.add_edge("action", "rerank")
        self.graph = graph.compile()
        self.tools = {t.name: t for t in tools}
        self.model = model.bind_tools(tools)
        self.retries = 0

    def call_llm(self, state: AgentState):
        search_query = state["search_query"]
        # if search_query.questions:
        #     search_query = "\n".join([q.original for q in search_query.questions])
        # print(search_query)
        if self.system:
            messages = [SystemMessage(content=self.system)] + [HumanMessage(content=str(search_query))]
        message = self.model.invoke(messages)
        
        # print(message.tool_calls)
        
        return {"tool_calls": message}

    def rerank(self, state: AgentState):
        docs = state["knowledges"]
        
        if not self.rerank_mdl:
            sim, tsim, vsim = retrievaler.manual_rerank(self.dialog.id, docs, state["query"].content)
        else:
            sim, tsim, vsim = retrievaler.manual_rerank_by_model(self.rerank_mdl, docs, state["query"].content,
                                                                 1 - self.dialog.vector_similarity_weight, self.dialog.vector_similarity_weight)
        sorted_knowledge = [knowledge for _, knowledge in sorted(zip(sim, docs), key=lambda pair: pair[0], reverse=True)]
        
        return {"knowledges": sorted_knowledge[:8], "messages": [HumanMessage(content="🔄 Đang kiểm tra lại dữ liệu...\n\n")]}
        
        # sim, tsim, vsim = retrievaler.manual_rerank(state["dialog_id"], state["knowledges"], state["query"].content)
        # knowledges = []ss
        # vector_similarity_threshold = 0.2
        # for i in range(len(docs)):
        #     if sim[i] >= vector_similarity_threshold:
        #         knowledges.append((docs[i], sim[i]))
        # # Sắp xếp knowledges theo giá trị sim giảm dần
        # knowledges.sort(key=lambda x: x[1], reverse=True)
        
        # # Lấy 6 phần tử đầu tiên
        # top_knowledges = [doc for doc, _ in knowledges[:6]]
        # return {"knowledges": top_knowledges}

    def exists_action(self, state: AgentState):
        result = state["tool_calls"]
        try:
            tool_calls = result.tool_calls
        except:
            tool_calls = []
        return len(tool_calls) > 0
    
    def take_action(self, state: AgentState):
        tool_calls = state["tool_calls"].tool_calls
        results = set(state.get("knowledges", []))
        threads = []
        lock = threading.Lock()

        def call_tool(t):
            print(f"Calling: {t}")
            if t['name'] not in self.tools:
                print("\n ....bad tool name....")
                result = "bad tool name, retry"
            else:
                result = self.tools[t['name']].invoke(t['args'])
                
            with lock:
                results.update(result)

        for t in tool_calls:
            thread = threading.Thread(target=call_tool, args=(t,))
            threads.append(thread)
            thread.start()

        for thread in threads:
            thread.join()
        print("Back to the model!")
        return {'knowledges': list(results)}


if __name__ == '__main__':
    question = input("Question: ")
    dialog_id = "7a2d6956b6cd11ef9b3f0242ac140008"
    # tool = Retrieval(dialog_id)
    duckduckgo = DuckDuckGo()
    model = ChatOpenAI(model="gpt-4o-mini")  #reduce inference cost
    retrieval = Retrieval(dialog_id=dialog_id)
    abot = SearchAgent(model, [retrieval])
    messages = [HumanMessage(content=question)]
    result = abot.graph.invoke({"search_query": HumanMessage(content=question)})
    docs = []
    for message in result["knowledges"]:
        docs.append(message)
    print(question, type(question))
    sim, tsim, vsim = retrievaler.manual_rerank(dialog_id, docs, question)
    count = 0
    for i in range(len(docs)):
        if sim[i] >= 0.2:
            print("--------------------------------------------")
            print(docs[i], sim[i])
            print("--------------------------------------------")
            count += 1
    print(count)
            
    