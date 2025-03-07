from abc import ABC
from typing import List, Dict, Any
from pydantic import BaseModel
import time
import threading
from fastapi import APIRouter, Request
from utils.api_utils import get_json_result, RetCode
import torch
# from FlagEmbedding import FlagReranker

router = APIRouter(tags=["Rerank"])

    
class Base(ABC):
    results: List[Dict[str, Any]]
    model: str
    object: str
    created: float
    def __init__(self, key, model_name):
        pass
    
    def rerank(self, query: str, documents: list[str]):
        raise NotImplementedError("Please implement rerank method!")
    
class DefaultRerank(Base):
    _model = None
    _model_lock = threading.Lock()
    
    def __init__(self, key, model_name, **kwargs):
        from sentence_transformers import CrossEncoder
        if not DefaultRerank._model:
            DefaultRerank._model = CrossEncoder(model_name)
            DefaultRerank._model.model.half()
        self._model = DefaultRerank._model
        
    def rerank(self, query: str, documents: list[str]):
        pairs = [[query, doc] for doc in documents]
        scores = self._model.predict(pairs)
        scores = [float(score) for score in scores]
        results = [{
            "relevance_score": score,
            "index": i,
            "document": documents[i]
        } for i, score in enumerate(scores)]
        sorted_results = sorted(results, key=lambda x : x["relevance_score"], reverse=True)
        return sorted_results
        
class HaLongRerank(Base):
    _model = None
    _model_lock = threading.Lock()
    
    def __init__(self, key, model_name, **kwargs):
        from sentence_transformers import SentenceTransformer
        if not HaLongRerank._model:
            HaLongRerank._model = SentenceTransformer(model_name)
        self._model = HaLongRerank._model
        
    def rerank(self, query: str, documents: list[str]):
        query_embedding = self._model.encode([query])
        doc_embeddings = self._model.encode(documents)
        similarities = self._model.similarity(query_embedding, doc_embeddings).flatten()
        sorted_indices = torch.argsort(similarities, descending=True).tolist()
        sorted_results = [{
            "relevance_score": float(similarities[i].item()),
            "index": i,
            "document": documents[i]
        } for i in sorted_indices]
        
        return sorted_results

class ViRerank(Base):
    _model = None
    _model_lock = threading.Lock()
    
    def __init__(self, key, model_name, **kwargs):
        if not ViRerank._model:
            ViRerank._model = FlagReranker(model_name,
                                             use_fp16=True)
        self._model = ViRerank._model
        
    def rerank(self, query: str, documents: list[str]):
        pairs = [[query, doc] for doc in documents]
        scores = self._model.compute_score(pairs, normalize=True)
        scores = [float(score) for score in scores]
        results = [{
            "relevance_score": score,
            "index": i,
            "document": documents[i]
        } for i, score in enumerate(scores)]
        sorted_results = sorted(results, key=lambda x : x["relevance_score"], reverse=True)
        return sorted_results
# rerank_model = DefaultRerank(key="", model_name="itdainb/PhoRanker")
rerank_model = HaLongRerank(key="", model_name="hiieu/halong_embedding")        
# rerank_model = ViRerank(key="", model_name="namdp-ptit/ViRanker")        

@router.post("")
async def rerank(request: Request):
    try:
        request = await request.json()
    except Exception as e:
        return get_json_result(data=False, retcode=RetCode.EXCEPTION_ERROR,
                               retmsg=str(e))
    query = request.get("query", "")
    documents = request.get("documents", [])
    reranked_results = rerank_model.rerank(query, documents)
    return get_json_result(data=reranked_results)