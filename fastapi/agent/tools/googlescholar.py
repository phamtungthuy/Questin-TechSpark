from typing import Type, List
from pydantic import BaseModel, Field
from scholarly import scholarly
from langchain_core.tools import BaseTool

class GoogleScholarParam(BaseModel):
    query: str = Field(description="Query from user to search from Google Scholar")

class GoogleScholar(BaseTool):
    name: str = "Google Scholar"
    description: str = "Google Scholar search engine"
    args_schema: Type[BaseModel] = GoogleScholarParam
    top_n: int = 6
    sort_by: str = "relevance"
    year_low: int = None
    year_high: int = None
    parents: bool = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
    def _run(self, query: str) -> list[str]:
        scholar_client = scholarly.search_pubs(query, patents=self.parents, year_low=self.year_low,
                                               year_high=self.year_high, sort_by=self.sort_by)
        scholar_res = []
        for i in range(self.top_n):
            try:
                pub = next(scholar_client)
                scholar_res.append({"content": 'Title: ' + pub['bib']['title'] + '\n_Url: <a href="' + pub[
                    'pub_url'] + '"></a> ' + "\n author: " + ",".join(pub['bib']['author']) + '\n Abstract: ' + pub[
                                                   'bib'].get('abstract', 'no abstract')})

            except StopIteration or Exception as e:
                print("**ERROR** " + str(e))
                break
            
        return [item["content"] for item in scholar_res]
