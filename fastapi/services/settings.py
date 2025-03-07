import os
from utils import decrypt_database_config, get_base_config
from utils.log_utils import LoggerFactory, getLogger
from utils.file_utils import get_project_base_directory

ES = get_base_config("es", {})
MINIO = decrypt_database_config(name="minio")
try:
    REDIS = decrypt_database_config(name="redis")
except Exception as e:
    REDIS = {}
DOC_MAXIMUM_SIZE = int(os.environ.get("MAX_CONTENT_LENGTH", 128 * 1024 * 1024))



LoggerFactory.set_directory(
    os.path.join(
        get_project_base_directory(),
        "logs",
        "rag"))
# {CRITICAL: 50, FATAL:50, ERROR:40, WARNING:30, WARN:30, INFO:20, DEBUG:10, NOTSET:0}
LoggerFactory.level = 20

es_logger = getLogger("es")
minio_logger = getLogger("minio")
cron_logger = getLogger("cron_logger")

SVR_QUEUE_NAME = "questin_svr_queue"
SVR_QUEUE_RETENTION = 60*60
WEBHOOK_QUEUE_NAME = "questin_webhook_queue"