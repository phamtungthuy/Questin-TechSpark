from typing import List
import numpy as np
from abc import ABC
from openai import OpenAI

class Base(ABC):
    def __init__(self, key, model_name):
        pass
    
    def encode(self, texts: list, batch_size=32):
        raise NotImplementedError("Please implement encode method!")
    
    def encode_queries(self, text: str):
        raise NotImplementedError("Please implment encode method!")
    
class OpenAIEmbed(Base):
    def __init__(self, key, model_name="keepitreal/vietnamese-sbert",
                 base_url="https://api.openai.com/v1"):
        if not base_url:
            base_url = "https://api.openai.com/v1"
        self.client = OpenAI(api_key=key, base_url=base_url)
        self.model_name = model_name

    def encode(self, texts: list, bactch_size=32):
        res = self.client.embeddings.create(input=texts,
                                            model=self.model_name)
        return [d.embedding for d in res.data]
    
    def encode_queries(self, text):
        res = self.client.embeddings.create(input=[text],
                                            model=self.model_name)
        return res.data[0].embedding

from langchain.embeddings.base import Embeddings
class MyEmbeddings(Embeddings):
    def __init__(self, api_key: str, base_url: str, model_name: str):
        self.embedding = OpenAIEmbed(
            key=api_key,
            model_name=model_name,
            base_url=base_url,
        )
        
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.embedding.encode_queries(text) for text in texts]
    
    def embed_query(self, query: str) -> List[float]:
        return self.embedding.encode_queries(query)
    