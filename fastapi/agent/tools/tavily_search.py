from tavily import TavilyClient
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Type, List

class TavilyParam(BaseModel):
    query: str = Field(description="Query from user to search from tavily")
    
class TavilySearch(BaseTool):
    name: str = "TavilySearch"
    description: str = "Tavily search engine"
    args_schema: Type[BaseModel] = TavilyParam
    top_n: str = 10
    
    def _run(self, query: str, api_key: str) -> List[str]:
        tavily_client = TavilyClient(api_key=api_key)
        response = tavily_client.search(query)
        
        return response

if __name__ == "__main__":
    test = TavilySearch()
    print(test._run("Leo Messi là ai"))
