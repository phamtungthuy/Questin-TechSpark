from typing import Type, List
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
from duckduckgo_search import DDGS

class DuckDuckGoParam(BaseModel):
    query: str = Field(description="Query from user to search from duckduckgo")

class DuckDuckGo(BaseTool):
    name: str = "DuckDuckGo"
    description: str = "DuckDuckGo search engine"
    args_schema: Type[BaseModel] = DuckDuckGoParam
    top_n: str = 10
    
    def _run(self, query: str) -> List[str]:
        with DDGS() as ddgs:
            duck_res = [{"content": '<a href="' + i["href"] + '">' + i["title"] + '</a>    ' + i["body"]} for i
                        in ddgs.text(query, max_results=self.top_n)]
        return [item["content"] for item in duck_res]
    