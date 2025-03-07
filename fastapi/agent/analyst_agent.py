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

MAX_RETRIES = 1

class Question(BaseModel):
    original: str = Field(description="The exact phrasing of the question as it appears in the input query text.")
    paraphrased: str = Field(description="A rephrased version of the question in formal Vietnamese, ensuring clarity, conciseness, and correctness while preserving the original meaning.")
    keyword: str = Field(description="An array of KEYWORDS appearing explicitly in the question or its context. The keywords need to be refined to the lowest meaning level and accurately reflect the content of the question. You could consider nouns, verbs, adjectives and number.")
    context: str = Field(description="An array of RELEVANT CONTEXT that supports or frames the question. This includes any implied conditions, background information, or scenarios that the asker assumes. Do not leave context empty or generate additional information that does not appear in the questions.")
    target: str = Field(description="The user's intention when posing the question.")
    
class Queries(BaseModel):
    questions: list[Question]
    # long_term: list[str] = Field(description="A JSON object containing base information about the user (such as interests, school, achievements, name, etc.). Just return a JSON array of strings.")
    # short_term: list[str] = Field(description="A JSON object containing summarized versions of each question.")
    
class AnalystAgent(Agent):
    """
    AnalystAgent is designed to process natural language queries and organize them into a structured JSON format.

    Attributes:
        model (ChatOpenAI): The language model used for processing queries.
        system (str): The system message providing instructions for the agent's behavior.
        graph (StateGraph): The compiled state graph defining the agent's logic flow.
    """

    def __init__(self, model, tools, system=None):
        """
        Initializes the AnalystAgent with the given model, tools, and system instructions.

        Args:
            model (ChatOpenAI): The language model instance.
            tools (list): Additional tools for the agent (currently unused).
            system (str, optional): Custom instructions for the agent's behavior. Defaults to a predefined instruction string.
        """
        """
        Old prompt:
        The JSON object should have the following structure:
                - questions: An array of question objects. Each question object must contain the following fields:
                    - original: The exact phrasing of the question as it appears in the input query text.
                    - paraphrased: A rephrased version of the question in formal Vietnamese, ensuring clarity, conciseness, and correctness while preserving the original meaning.
                    - keyword: Any relevant information explicitly mentioned in the query.
                - long-term: A JSON object containing base information about the user (such as interests, school, achievements, name, etc.). Just return a JSON array of strings.
                - short-term: A JSON object containing summarized versions of each question.
        """
        if not system:
            system = (
                """
                You are an query analyst. Receive user requests, and your task is to analyze them into questions along with context, target, and important information (keywords). This analysis help SearchAgent formulate appropriate questions to search for relevant knowledge to answer the query. 
                To achieve that, you need to:
                - Do not answer any questions. 
                - Identify and separate the questions in the query text. Then analyze these questions in many fields below. These questions MUST be included in the results. 
                - Consider the reflected feedbacks in "Reflection Questions" sections and add all additional questions to improve the results. There are multiple "Reflection Questions" sections, so you need to consider all these sections. The additional questions MUST be close to the user query's target and reflected feedback.
                - When identify the target of questions, analyze the keywords, phrasing and context to determine what specific information or clarification they seek. Ensure complete semantic clarity of the objective, avoiding any
                words with relative meanings or implications of other terms or ambiguous words such as 'này', 'kia', 'thế này', 'thế kia', v.v. The objectives need to include comprehensively context of this questions. For questions with context or conditions, the 'target' must fully include those details.
                - Generate a JSON object that contains questions extracted from the query text and "Reflection Questions" sections. The output MUST be in VIETNAMESE, but not in ENGLISH.
                """
            )
            
        reflection_sytem = """
            You are a reflection agent. Your task is to evaluate the user question analysis results from AnalystAgent and provide additional questions. Specifically, your task includes:
            - Carefully review the list of questions analyzed by AnalystAgent, paying particular attention to the 'target' of the question, as well as the context and keywords.
            - Assess whether the list is 'sufficient' and 'detailed.' A list of questions is considered sufficient if it adequately covers the intent of the user's original input question.
            - If the list of questions is sufficient, set 'enough' = true and do not ask any additional questions (leave additional_questions EMPTY). Otherwise, set 'enough' = false and propose questions to help AnalystAgent fully cover the intent of the user's original question.
            - The additional questions must closely align with the 'target' of the original question and avoid straying into extraneous or supplementary information. Be stick to the target (objectives) of the first question (original user's question). Do not ask questions about the user's information or incomplete/unspecified details in the question unless those are the primary intent of the user's original question.
            For example, if information about time, a specific address or a specific object is missing or unidentified, do not ask questions to clarify it. Instead, assume that such information is already available and general and focus on formulating questions aligned with the objective of the original question.
            For example, if the user asks a question about 'The company's salary policy?' and the 'company' is not specified, assume it refers to a general company and do not attempt to clarify it.
            - Addition to the reflected questions, you also ask any extending questionss. To do that, follow these steps:
                + Identify the keywords in the question.
                + Find synonyms for these keywords.
                + Replace the keywords in the original question with their synonyms to generate extending questions.
                + Each keywords should be replaced at least one time.
            
            Generate response in JSON format. It includes the following fields:
            - enough: Decide whether the questions array is sufficient to indicate the requirements of input query or not. The value is true or false.
            - additional_questions: An array of questions that you want to implement to the AnalystAgent to improve the question array. Just 2 questions reflected.
            - keywords: An array of keywords in input query text.
            - extending_questions: An array of extending questions that has the same meaning as the input query text and includes keywords's synonyms. Just 1 extending questions reflected.
            
            To be clearer, the output format is JSON:
            {
                "enough": true/false,
                "additional_questions": [
                    "question (only its content)", 
                    "question (only its content)", 
                    ...
                ],
                "keywords_synonyms": {
                    "keyword": [synonyms],
                    "keyword": [synonyms],
                    "keyword": [synonyms],
                    ....  
                },
                "extending_questions": [
                    "extending questions (questions with synonyms)",
                    ...
                ],
            }
            
        """
        
        cleaner_system = """
            You are a query preprocessor. Do not answer the questions. Your task is to preprocess user queries by cleaning them up. Specifically, your job includes:
            - Correcting errors: Fix misspelled words.
            - Auto-completion: For incomplete queries, such as those containing only a subject, try to complete the query in the form of an introduction question.
            - Handling special characters: Remove special characters that do not add meaning to the sentence.
            - Improving clarity: Replace words with synonyms if it helps clarify the meaning of the query.
            - Sentence type: Ensure questions typically end with a '?' while declarative statements do not.
            - Length Optimization: Remove redundant and meaningless parts from the questions which are useless in answering the questions. Keep only the key parts that identify the question.
            Just return the processed query.
        """
        
        # - Adding abbreviations: Find keywords in the query. If any keywords commonly be abbreviated (For example, "Quản lý hành chính (QLHC), Uỷ ban nhân dân (UBND)"), add the abbreviation next to these words or phrases. Example: 'Quản lý hành chính' -> 'Quản lý hành chính (QLHC)'. Try switching between the abbreviation and the full phrase to ensure accuracy. 
        #     - Expanding abbreviations: For abbreviations in Vietnamese or English, expand them with their full form (Keep abbreviation, annotate the full form next to it). Example: 'QLHC' -> 'QLHC (Quản lý hành chính)'.

        self.system = system
        self.reflection_system = reflection_sytem
        self.cleaner_system = cleaner_system
        self.model = model
        self.retries = 0

        # Initialize and configure the state graph
        graph = StateGraph(AgentState)
        graph.add_node("cleaner", self.cleaner_call_llm)
        graph.add_node("llm", self.call_llm)
        graph.add_node("reflection", self.reflection_call_llm)
        graph.add_edge("cleaner", "llm")
        graph.add_conditional_edges("llm", self.should_continue)
        graph.add_edge("reflection", "llm")
        graph.set_entry_point("cleaner")
        self.graph = graph.compile()

    def call_llm(self, state: AgentState):
        """
        Calls the language model to process messages and generate a response.

        Args:
            state (AgentState): The current state containing input messages.

        Returns:
            dict: A dictionary containing the updated messages with the model's response.
        """
        
        print("*** CALL ANALYST AGENT ***")
        
        
        history = state['history']
        query = state["query"]
        analyst_reflection = state['analyst_reflection'] if 'analyst_reflection' in state else []
        
        # Prepend system instructions if provided
        if self.system:
            messages = [SystemMessage(content=self.system)] + analyst_reflection + [query]
            
        # Invoke the model and return the response
        response_message = self.model.with_structured_output(Queries).invoke(messages)
        print(response_message)
        
        return {"search_query": response_message}
    
    def reflection_call_llm(self, state: AgentState):
        """
        Calls the language model to refine the question array extracted from the user query by asking a few questions.

        Args:
            state (AgentState): The current state containing input messages.

        Returns:
            dict: A dictionary containing the updated messages with the model's response.
        """
        
        print("*** CALL REFLECTION AGENT ***")
        

        query = state["query"]
        search_query = state["search_query"]
        
        # Prepend system instructions if provided
        if self.reflection_system:
            messages = [SystemMessage(content=self.reflection_system)] + [query] + [HumanMessage(content=str(search_query))]
            
        # Invoke the model and return the response
        # response_message = self.model.with_structured_output(Queries).invoke(messages)
        response_message = self.model.invoke(messages)
        
        json_response = {}
        
        try:
            json_response = json.loads(response_message.content)
        except ValueError:
            json_response = {}
    
        if 'extending_questions' in json_response and json_response['extending_questions']:
            response_message.content = "Reflection Questions: " + " ".join(json_response['extending_questions'])
            print("Reflection: ", response_message.content)
        else:
            response_message.content = "[]"

        if 'enough' not in json_response or json_response['enough']:
            self.retries = MAX_RETRIES    
            
        reflection = state['analyst_reflection'] if 'analyst_reflection' in state else []
        reflection.append(HumanMessage(content=response_message.content))
        
        return {"analyst_reflection": reflection}
    
    def cleaner_call_llm(self, state: AgentState):
        """
        Calls the language model to clean the query array in the specified rules.

        Args:
            state (AgentState): The current state containing input messages.

        Returns:
            dict: A dictionary containing the updated messages with the model's response.
        """
        
        print("*** CALL CLEANER AGENT ***")
        

        query = state["query"]
        
        # Prepend system instructions if provided
        if self.cleaner_system:
            messages = [SystemMessage(content=self.cleaner_system)] + [query]
            
        # Invoke the model and return the response
        # response_message = self.model.with_structured_output(Queries).invoke(messages)
        response_message = self.model.invoke(messages)
        print(response_message)
             
        return {"query": HumanMessage(response_message.content)}
    
    def should_continue(self, state: AgentState):
        
        self.retries += 1
        
        if self.retries <= MAX_RETRIES:
            return "reflection"
        
        return END

    def take_action(self, state: AgentState):
        """
        Placeholder for additional actions based on state. (Currently unused)

        Args:
            state (AgentState): The current state of the agent.
        """
        pass

if __name__ == '__main__':
    # Prompt for OpenAI API key if not set in the environment
    # Get user input for the query
    question = input("Question: ")
    
    question = "User Query: " + question

    # Initialize the AnalystAgent with a language model
    model = ChatOpenAI(
        # api_key="123",
        # base_url="http://27.65.59.245:54354/v1", # This is the default and can be omitted,
        # model="cognitivecomputations/Dolphin3.0-Llama3.2-3B"
        model="gpt-4o-mini",
    )
    abot = AnalystAgent(model, tools=[])

    # Prepare input messages

    # reflection_message = ['Em muốn biết cụ thể về nội dung chương trình học của ngành CN1 và CN8 không?', 'Em có thể cho biết thêm về mục tiêu nghề nghiệp của mình trong lập trình phần mềm?', 'Em muốn so sánh hai ngành này dựa trên cơ hội việc làm hay yêu cầu kỹ năng không?']

    # reflection = HumanMessage(content=" ".join(reflection_message))
    
    # Invoke the agent's state graph with the input messages
    result = abot.graph.invoke({"query": HumanMessage(content=question), "history": [], "analyst_reflection": []})
    
    # search_query = result["search_query"]
    # print(search_query.content)
    
    analyst_reflection = result["analyst_reflection"]
    print(analyst_reflection)
    # Print the model's response
    # print(search_query.content)
    # print(search_query.long_term)
    # print(search_query.short_term)