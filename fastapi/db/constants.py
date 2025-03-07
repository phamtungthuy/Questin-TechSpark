from enum import Enum
from strenum import StrEnum

class StatusEnum(Enum):
    VALID = "1"
    INVALID = "0"

class TenantPermission(StrEnum):
    ME = "me"
    TEAM = "team"

class TaskStatus(StrEnum):
    UNSTART = "0"
    RUNNING = "1"
    CANCEL = "2"
    DONE = "3"
    FAIL = "4"

class UserType(StrEnum):
    USER = "user"
    GUEST = "guest"
    FACEBOOK = "facebook"
    
    
class IntegrationType(StrEnum):
    WEBHOOK = 'webhook'
    OAUTH = 'oauth'
    API = 'api'
    
class CredentialType(StrEnum):
    VERIFY_TOKEN = 'verify_token'
    SECRET_KEY = 'secret_key'
    PAGE_ACCESS_TOKEN = 'page_access_token'
    WEBHOOK_URL = 'webhook_url'
    

class ParserType(StrEnum):
    PRESENTATION = "presentation"
    LAWS = "laws"
    MANUAL = "manual"
    PAPER = "paper"
    RESUME = "resume"
    BOOK = "book"
    QA = "qa"
    TABLE = "table"
    NAIVE = "naive"
    PICTURE = "picture"
    ONE = "one"
    AUDIO = "audio"
    EMAIL = "email"
    KG = "knowledge_graph"
    GSO = "gso"
    
class UserTenantRole(StrEnum):
    OWNER = 'owner'
    ADMIN = 'admin'
    NORMAL = 'normal'
    INVITE = 'invite'
    
class LLMType(StrEnum):
    CHAT = 'chat'
    EMBEDDING = 'embedding'
    SPEECH2TEXT = 'speech2text'
    IMAGE2TEXT = 'image2text'
    RERANK = 'rerank'
    TTS    = 'tts'
    
class FileType(StrEnum):
    PDF = 'pdf'
    DOC = 'doc'
    VISUAL = 'visual'
    AURAL = 'aural'
    VIRTUAL = 'virtual'
    FOLDER = 'folder'
    OTHER = "other"

class FileSource(StrEnum):
    LOCAL = ""
    KNOWLEDGEBASE = "knowledgebase"
    S3 = "s3"

KNOWLEDGEBASE_FOLDER_NAME=".knowledgebase"
