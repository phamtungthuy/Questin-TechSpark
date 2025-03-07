import os
from utils import decrypt_database_config, get_base_config
from utils.file_utils import get_project_base_directory
from utils.log_utils import LoggerFactory, getLogger
from services.conn.es_conn import ELASTICSEARCH
from services.nlp import search
from services.graph_rag import search as kg_search

LoggerFactory.set_directory(
    os.path.join(
        get_project_base_directory(),
        "logs",
        "db"))
# {CRITICAL: 50, FATAL:50, ERROR:40, WARNING:30, WARN:30, INFO:20, DEBUG:10, NOTSET:0}
LoggerFactory.level = 20

stat_logger = getLogger("stat")
chat_logger = getLogger("chat")

database_logger = getLogger("database")

DATABASE = decrypt_database_config(name="mysql")

DATABASE_TYPE = os.getenv("DB_TYPE", 'mysql')

QUESTIN_SERVICE_NAME = "questin"

SECRET_KEY = get_base_config(
    QUESTIN_SERVICE_NAME,
    {}).get("secret_key", "questin_secret_key")

LIGHTEN = int(os.environ.get("LIGHTEN", "0"))

LLM = get_base_config("user_default_llm", {})
LLM_FACTORY = LLM.get("factory", "OpenAI")
LLM_BASE_URL = LLM.get("base_url")

if not LIGHTEN:
    default_llm = {
        "Tongyi-Qianwen": {
            "chat_model": "qwen-plus",
            "embedding_model": "text-embedding-v2",
            "image2text_model": "qwen-vl-max",
            "asr_model": "paraformer-realtime-8k-v1",
        },
        "OpenAI": {
            "chat_model": "gpt-4o-mini",
            "embedding_model": "text-embedding-3-small",
            "image2text_model": "gpt-4-vision-preview",
            "asr_model": "whisper-1",
        },
        "Azure-OpenAI": {
            "chat_model": "gpt-35-turbo",
            "embedding_model": "text-embedding-ada-002",
            "image2text_model": "gpt-4-vision-preview",
            "asr_model": "whisper-1",
        },
        "ZHIPU-AI": {
            "chat_model": "glm-3-turbo",
            "embedding_model": "embedding-2",
            "image2text_model": "glm-4v",
            "asr_model": "",
        },
        "Ollama": {
            "chat_model": "qwen-14B-chat",
            "embedding_model": "flag-embedding",
            "image2text_model": "",
            "asr_model": "",
        },
        "Moonshot": {
            "chat_model": "moonshot-v1-8k",
            "embedding_model": "",
            "image2text_model": "",
            "asr_model": "",
        },
        "DeepSeek": {
            "chat_model": "deepseek-chat",
            "embedding_model": "",
            "image2text_model": "",
            "asr_model": "",
        },
        "VolcEngine": {
            "chat_model": "",
            "embedding_model": "",
            "image2text_model": "",
            "asr_model": "",
        },
        "BAAI": {
            "chat_model": "",
            "embedding_model": "BAAI/bge-large-zh-v1.5",
            "image2text_model": "",
            "asr_model": "",
            "rerank_model": "BAAI/bge-reranker-v2-m3",
        },
        "OpenAI-API-Compatible": {
            "chat_model": "",
            "embedding_model": "keepitreal/vietnamese-sbert",
            "image2text_model": "",
            "asr_model": "",
            "rerank_model": ""
        }
        
    }

    CHAT_MDL = default_llm[LLM_FACTORY]["chat_model"]
    EMBEDDING_MDL = default_llm["OpenAI-API-Compatible"]["embedding_model"]
    RERANK_MDL = default_llm["BAAI"]["rerank_model"]
    ASR_MDL = default_llm[LLM_FACTORY]["asr_model"]
    IMAGE2TEXT_MDL = default_llm[LLM_FACTORY]["image2text_model"]
else:
    CHAT_MDL = EMBEDDING_MDL = RERANK_MDL = ASR_MDL = IMAGE2TEXT_MDL = ""

API_KEY = LLM.get("api_key", "")
PARSERS = LLM.get(
    "parsers",
    "naive:General,qa:Q&A,resume:Resume,manual:Manual,table:Table,paper:Paper,book:Book,laws:Laws,presentation:Presentation,picture:Picture,one:One,audio:Audio,knowledge_graph:Knowledge Graph,email:Email,gso:GSO")

retrievaler = search.Dealer(ELASTICSEARCH)
kg_retrievaler = kg_search.KGSearch(ELASTICSEARCH)