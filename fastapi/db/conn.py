import os
from db.settings import DATABASE
from playhouse.pool import PooledMySQLDatabase
from db.settings import stat_logger
from functools import wraps
from utils.log_utils import getLogger

LOGGER = getLogger()


def singleton(cls, *args, **kw):
    """
    A decorator to implement the singleton pattern for a class.
    This ensures that only one instance of the class is created per process.
    Args:
        cls (type): The class to be instantiated as a singleton.
        *args: Variable length argument list to pass to the class constructor.
        **kw: Arbitrary keyword arguments to pass to the class constructor.
    Returns:
        function: A function that returns the singleton instance of the class.
    """
    instances = {}

    def _singleton():
        key = str(cls) + str(os.getpid())
        if key not in instances:
            instances[key] = cls(*args, **kw)
        return instances[key]

    return _singleton


@singleton
class BaseDataBase:
    def __init__(self):
        database_config = DATABASE.copy()
        db_name = database_config.pop("name")
        self.database_connection = PooledMySQLDatabase(
            db_name, **database_config
        )
        stat_logger.info('init mysql database on cluster mode successfully')
        
class DatabaseLock:
    def __init__(self, lock_name, timeout=10, db=None):
        self.lock_name = lock_name
        self.timeout = int(timeout)
        self.db = db if db else DB
        
    def lock(self):
        cursor = self.db.execute_sql(
            "SELECT GET_LOCK(%s, %s)", (self.lock_name, self.timeout))
        ret = cursor.fetchone()
        if ret[0] == 0:
            raise Exception(f'acquire mysql lock {self.lock_name} timeout')
        elif ret[0] == 1:
            return True
        else:
            raise Exception(f'failed to acquire lock {self.lock_name}')

    def unlock(self):
        cursor = self.db.execute_sql(
            "SELECT RELEASE_LOCK(%s)", (self.lock_name,))
        ret = cursor.fetchone()
        if ret[0] == 0:
            raise Exception(
                f'mysql lock {self.lock_name} was not established by this thread')
        elif ret[0] == 1:
            return True
        else:
            raise Exception(f'mysql lock {self.lock_name} does not exist')

    def __enter__(self):
        if isinstance(self.db, PooledMySQLDatabase):
            self.lock()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if isinstance(self.db, PooledMySQLDatabase):
            self.unlock()

    def __call__(self, func):
        @wraps(func)
        def magic(*args, **kwargs):
            with self:
                return func(*args, **kwargs)

        return magic
  
DB = BaseDataBase().database_connection
DB.lock = DatabaseLock

def close_connection():
    try:
        if DB:
            DB.close()
    except Exception as e:
        LOGGER.exception(e)
        
        