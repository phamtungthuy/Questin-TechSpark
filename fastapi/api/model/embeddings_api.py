from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter
import time
from abc import ABC
import threading

router = APIRouter()

class EmbeddingRequest(BaseModel):
    input: List[str]
    model: str

class EmbeddingResponse(BaseModel):
    data: List[Dict[str, Any]]
    usage: Dict[str, Any]
    model: str
    object: str
    created: float

class Base(ABC):
    def __init__(self, key, model_name):
        pass

    def encode(self, texts: list, batch_size=32):
        raise NotImplementedError("Please implement encode method!")

    def encode_queries(self, text: str):
        raise NotImplementedError("Please implement encode method!")

class DefaultEmbedding(Base):
    _model = None
    _model_lock = threading.Lock()
    def __init__(self, key, model_name, **kwargs):
        import torch
        from sentence_transformers import SentenceTransformer
        if not DefaultEmbedding._model:
            DefaultEmbedding._model = SentenceTransformer(model_name)
            if torch.cuda.is_available():
                DefaultEmbedding._model = DefaultEmbedding._model.to("cuda")
        self._model = DefaultEmbedding._model
        
    def encode(self, texts: list[str], batch_size=32):
        embeddings = self._model.encode(texts)
        return embeddings.tolist()
    
embedding_model = DefaultEmbedding(key="", model_name="keepitreal/vietnamese-sbert")

@router.post("")
async def embeddings(request: EmbeddingRequest):
    embeddings = embedding_model.encode(request.input)
    response = EmbeddingResponse(
        data=[{
            "object": "embedding",
            "embedding": emb,
            "index": idx
        } for idx, emb in enumerate(embeddings)],
        usage={"total_tokens": len(embeddings) * len(embeddings[0])},
        model="keepitreal/vietnamese-sbert",
        object="embedding",
        created=time.time()
    )
    return response