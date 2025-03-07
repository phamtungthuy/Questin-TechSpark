from abc import ABC

from openai import OpenAI
import numpy as np

from services.service_utils import truncate

class Base(ABC):
    def __init__(self, key, model_name):
        pass
    
    def encode(self, texts: list, batch_size=32):
        raise NotImplementedError("Please implement encode method!")
    
    def encode_queries(self, text: str):
        raise NotImplementedError("Please implment encode method!")
    
class OpenAIEmbed(Base):
    def __init__(self, key, model_name="text-embedding-ada-002",
                 base_url="https://api.openai.com/v1"):
        if not base_url:
            base_url = "https://api.openai.com/v1"
        self.client = OpenAI(api_key=key, base_url=base_url)
        self.model_name = model_name
        
    def encode(self, texts: list, batch_size=32):
        texts = [truncate(t, 8191) for t in texts]
        res = self.client.embeddings.create(input=texts,
                                            model=self.model_name)
        return np.array([d.embedding for d in res.data]
                        ), res.usage.total_tokens
        
    def encode_queries(self, text):
        res = self.client.embeddings.create(input=[truncate(text, 8191)],
                                            model=self.model_name)
        return np.array(res.data[0].embedding), res.usage.total_tokens
    
class LocalAIEmbed(Base):
    def __init__(self, key, model_name, base_url):
        if not base_url:
            raise ValueError("Local embedding model url cannot be None")
        self.client = OpenAI(api_key="empty", base_url=base_url)
        self.model_name = model_name.split("___")[0]
        
    def encode(self, texts: list, batch_size=32):
        res = self.client.embeddings.create(input=texts, model=self.model_name)
        return (
            np.array([d.embedding for d in res.data]),
            1024
        )
        
    def encode_queries(self, text):
        embds, cnt = self.encode([text])
        return np.array(embds[0]), cnt
    
class OpenAI_APIEmbed(OpenAIEmbed):
    def __init__(self, key, model_name, base_url):
        if not base_url:
            raise ValueError("url cannot be None")
        self.client = OpenAI(api_key=key, base_url=base_url)
        self.model_name = model_name.split("___")[0]