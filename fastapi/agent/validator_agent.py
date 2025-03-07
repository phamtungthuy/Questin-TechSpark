from langgraph.graph import StateGraph
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from agent.agent_base import Agent, AgentState
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import json


load_dotenv()
class Queries(BaseModel):
    enough: bool = Field(description="Whether the provided knowledge is enough to answer the question.")
    questions: list[str] = Field(description="A list of follow-up questions to gain information to inferring.")
    

class ValidatorAgent(Agent):
    def __init__(self, model, tools, system=None):
        if not system:
            system = """You are a smart validator assistant. Your task is to review the retrieved information and evaluate its sufficiency in answering the query accurately.  
                        If knowledges is not sufficient, review thoroughly Provided Knowledges and user query text and extract the following information:
                        - Useful_information: extract only the information that is truly relevant and useful for answering the questions.
                        Ensure that the extracted information is concise, directly related to the question, and eliminates any irrelevant or redundant details. List all the information that you consider belongs to this category.
                        - Missing_information: Identify the missing essential parts needed to answer the original question. Accurately identify the objectives of user questions and provide any missing details in 'useful_information'. Do not search for overly broad information beyond the question's objectives; focus only on the key requirements. List all the information that you consider belongs to this category. Don't leave this array empty and contain at least 2 information. 
                        - Unclear_information: Identify the information that APPEARS and is MENTIONED in "useful_information" but NOT CLEARLY presented or FULLY DETAILED in Provided Knowledges. Pay more attention to each nouns, adjectives, verbs, and the meaning of the information in the 'useful_question' section. List all the information that you consider belongs to this category. 
                        - If some information is mentioned but refers to other information in the knowledges, it must also be replaced by the corresponding accurate information in knowledges. For example, words like 'này', 'kia', 'trường học này', 'bệnh viện kia', v.v need to be replaced by precise word, such as "trường Đại học Bách Khoa Hà Nội" hoặc "Bệnh viện Việt Đức" if they mentioned in Provided Knowledges. 
                        Don't leave this array empty and contain at least 2 information. 
                        - Supporting questions: Formulate questions for the SearchAgent based on 'missing_information' and 'unclear_information' with the goal of clarifying these details. The questions should closely align with the information in 'missing_information' and 'unclear_information' sections. You need to generate questions for each information in 'missing_information' and 'unclear_information'.
                        Ensure that you have comprehensively listed all the information in each section. It is considered complete when, for each section, no additional information with a similar role can be extracted. Try to find suitable information.
                        
                        Output MUST is a JSON object containing:
                            - "enough": Whether the provided knowledge is enough to answer the question.
                            - "useful_information": An array of information that could be use to infer the answer in the current knowledge base.
                            - "missing_information": An array of missing essential parts needed to answer the original question. Accurately identify the objectives of user questions and provide any missing details in 'useful_information'. Do not search for overly broad information beyond the question's objectives; focus only on the key requirements.
                            - "unclear_information": An array of information that appears and is mentioned in "useful_information" but not clearly presented or fully detailed in "knowledges". Pay more attention to each nouns, adjectives, verbs, and the meaning of the information in the 'useful_question' section. List all the information that you consider belongs to this category. 
                            - "supporting_questions": An array of questions for SearchAgent based on 'missing_information' and 'unclear_information' with the goal of clarifying these details. The questions should closely align with the information in 'missing_information' and 'unclear_information' sections. You need to generate questions for each information in 'missing_information' and 'unclear_information'.

                        Let's do step by step, double check many times to ensure the consistency. Don't leave any fields empty if knowledge is not sufficient. The question is in Vietnamese.
                        
                        For example:
                        - User query: "Are A and B allowed to take the exam if they score 7 in English and 10 in Mathematics?" 
                        - Knowledges: "Only students with scores higher than the minimum required are allowed to take the exam. A higher-than-average score, as defined by the university's regulations, will grant direct entry into the final round of exams."
                        - Useful_information: "Only students with scores higher than the minimum required are allowed to take the exam."
                        - Missing_information: "The minimum required score level is not defined.  
                        - Unclear_information: "The minimum required score level is not defined.
                        - Supporting_questions: "Where is the minimum score defined? What is the minimum score?"

                        Provided Knowledge:
                        {knowledge}
                    """
        self.system = system
        self.model = model
        
        graph = StateGraph(AgentState)
        graph.add_node("llm", self.call_llm)
        graph.set_entry_point("llm")
        self.graph = graph.compile()
        
    def call_llm(self, state):
        knowledges = state["knowledges"]

        query = state["query"]
        
        if self.system:
            messages = [SystemMessage(content=self.system.format(knowledge=knowledges))] + [query]
        response_message = self.model.invoke(messages)
        
        json_response = json.loads(response_message.content)
        print(json_response)
    
        queries = Queries(
            enough=json_response["enough"],
            questions=json_response["supporting_questions"]
        )    
    
        return {"search_query": queries}
    
if __name__ == '__main__':
    question = input("Question: ")
    model = ChatOpenAI(model="gpt-4o-mini")
    abot = ValidatorAgent(model, tools=[])
    result = abot.graph.invoke({"query": HumanMessage(content=question), "knowledges": []})
    search_query = result["search_query"]
    print(search_query)