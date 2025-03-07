from typing import List, Type
from langchain_core.tools import BaseTool
from db.settings import retrievaler
from db.db_services.knowledgebase_service import KnowledgebaseService
from db.db_services.dialog_service import DialogService
from db.db_services.llm_service import LLMBundle
from db.constants import LLMType
from pydantic import Field, BaseModel

class RetrievalParam(BaseModel):
    query: str = Field(description="Query from user to retrieve information")


class Retrieval(BaseTool):
    name: str = "Retrievaler"
    description: str = "A tool for retrieving relevant information from a knowledge base. The database includes topics such as school information, legal matters, and e-commerce. Use this tool to find concise and accurate information related to the query."
    args_schema: Type[BaseModel] = RetrievalParam
    dialog_id: str = "Dialog ID to retrieve information"

    def __init__(self, dialog_id, **kwargs):
        super().__init__(**kwargs)
        self.dialog_id = dialog_id
    
    def _run(
        self, query: str
    ) -> List[str]:
        
        e, dialog = DialogService.get_by_id(self.dialog_id)
        if not e:
            return []
        
        rerank_mdl = None
        if dialog.rerank_id:
            rerank_mdl = LLMBundle(dialog.tenant_id, LLMType.RERANK, dialog.rerank_id)
        
        kbs = KnowledgebaseService.get_by_ids(dialog.kb_ids)
        embd_nms = list(set([kb.embd_id for kb in kbs]))
        if len(embd_nms) != 1:
            raise ValueError("The number of embd_nms is not 1")
        embd_mdl = LLMBundle(dialog.tenant_id, LLMType.EMBEDDING, embd_nms[0])
        kbinfos = retrievaler.retrieval(query, embd_mdl, dialog.tenant_id, dialog.kb_ids, 1, dialog.top_n,
                                    dialog.similarity_threshold, dialog.vector_similarity_weight,
                                    doc_ids=None, top=dialog.top_k, aggs=False, rerank_mdl=rerank_mdl)
        knowledges = [ck["content_with_weight"] for ck in kbinfos["chunks"]]
        return knowledges