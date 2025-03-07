import os
from enum import IntEnum, Enum
from utils.file_utils import get_project_base_directory
from utils.log_utils import LoggerFactory, getLogger
from utils import get_base_config

LoggerFactory.set_directory(
    os.path.join(
        get_project_base_directory(),
        "logs",
        "api"))
# {CRITICAL: 50, FATAL:50, ERROR:40, WARNING:30, WARN:30, INFO:20, DEBUG:10, NOTSET:0}
LoggerFactory.level = 20

stat_logger = getLogger("stat")
core_logger = getLogger("core")
chat_logger = getLogger("chat")
model_logger = getLogger("model")

CORE_QUESTIN_SERVICE_NAME = "questin"
CHAT_QUESTIN_SERVICE_NAME = "chat_questin"
MODEL_QUESTIN_SERVICE_NAME = "model_questin"

API_VERSION = "v1"

HOST = get_base_config(CORE_QUESTIN_SERVICE_NAME, {}).get("host", "127.0.0.1")
HTTP_PORT = get_base_config(CORE_QUESTIN_SERVICE_NAME, {}).get("http_port")

CHAT_HOST = get_base_config(CHAT_QUESTIN_SERVICE_NAME, {}).get("host", "127.0.0.1")
CHAT_HTTP_PORT = get_base_config(CHAT_QUESTIN_SERVICE_NAME, {}).get("http_port")

MODEL_HOST = get_base_config(MODEL_QUESTIN_SERVICE_NAME, {}).get("host", "127.0.0.1")
MODEL_HTTP_PORT = get_base_config(MODEL_QUESTIN_SERVICE_NAME, {}).get("http_port")

SECRET_KEY = get_base_config(
    CORE_QUESTIN_SERVICE_NAME,
    {}).get("secret_key", "questin_secret_key")

DATABASE_TYPE = os.getenv("DB_TYPE", 'mysql')

GITHUB_OAUTH = get_base_config("oauth", {}).get("github")
GOOGLE_OAUTH = get_base_config("oauth", {}).get("google")

ALGORITHM = "HS256"

class CustomEnum(Enum):
    @classmethod
    def valid(cls, value):
        try:
            cls(value)
            return True
        except BaseException:
            return False

    @classmethod
    def values(cls):
        return [member.value for member in cls.__members__.values()]

    @classmethod
    def names(cls):
        return [member.name for member in cls.__members__.values()]

class RetCode(IntEnum, CustomEnum):
    SUCCESS = 0
    NOT_EFFECTIVE = 10
    EXCEPTION_ERROR = 100
    ARGUMENT_ERROR = 101
    DATA_ERROR = 102
    OPERATING_ERROR = 103
    CONNECTION_ERROR = 105
    RUNNING = 106
    PERMISSION_ERROR = 108
    AUTHENTICATION_ERROR = 109
    UNAUTHORIZED = 401
    SERVER_ERROR = 500
