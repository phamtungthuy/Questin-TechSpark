from .embedding_model import *
from .chat_model import *
from .rerank_model import *

EmbeddingModel = {
    "OpenAI": OpenAIEmbed,
    "LocalAI": LocalAIEmbed,
    "OpenAI-API-Compatible": OpenAI_APIEmbed
}

CvModel = {
}

ChatModel = {
    "OpenAI": GptTurbo,
    "OpenAI-API-Compatible": GptTurbo
}

RerankModel = {
    "OpenAI-API-Compatible": OpenAI_APIRerank
}

Seq2txtModel = {
    
}

TTSModel = {
    
}