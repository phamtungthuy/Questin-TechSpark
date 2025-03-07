import os
import logging
from logging.handlers import TimedRotatingFileHandler
from threading import RLock
from utils import file_utils
import inspect

class LoggerFactory(object):
    """LoggerFactory is a utility class for managing and configuring loggers in a project. 
    It provides methods to set logging directories, initialize loggers, and retrieve or create logging handlers. 
    The class ensures thread-safe access to its logger and handler dictionaries using a reentrant lock.
    Attributes:
        TYPE (str): The type of logging, default is "FILE".
        LOG_FORMAT (str): The format for log messages.
        LEVEL (int): The logging level, default is logging.DEBUG.
        logger_dict (dict): A dictionary to store logger instances.
        global_handler_dict (dict): A dictionary to store global logging handlers.
        LOG_DIR (str): The directory for storing log files.
        PARENT_LOG_DIR (str): The parent directory for storing log files.
        log_share (bool): A flag indicating whether logs are shared.
        append_to_parent_log (bool): A flag indicating whether to append logs to the parent log directory.
        lock (RLock): A reentrant lock for thread-safe access to logger and handler dictionaries.
        levels (tuple): A tuple of logging levels.
        schedule_logger_dict (dict): A dictionary to store scheduled loggers.
    Methods:
        set_directory(directory=None, parent_log_dir=None, append_to_parent_log=None, force=False):
        new_logger(name):
            Creates a new logger instance with the specified name.
        get_logger(class_name=None):
            Retrieves or initializes a logger for the specified class name.
        get_global_handler(logger_name, level=None, log_dir=None):
        get_handler(class_name, level=None, log_dir=None, log_type=None, job_id=None):
            Retrieves or creates a logging handler based on the provided parameters.
        init_logger(class_name):
        assemble_global_handler(logger):
    """
    TYPE = "FILE"
    LOG_FORMAT = "[%(levelname)s] [%(asctime)s] [%(module)s.%(funcName)s] [line:%(lineno)d]: %(message)s"
    logging.basicConfig(format=LOG_FORMAT)
    LEVEL = logging.DEBUG
    logger_dict = {}
    global_handler_dict = {}
    
    LOG_DIR = None
    PARENT_LOG_DIR = None
    log_share = True
    
    append_to_parent_log = None
    
    lock = RLock()
    
    levels = (10, 20, 30, 40)
    schedule_logger_dict = {}
    
    @staticmethod
    def set_directory(directory=None, parent_log_dir=None, 
                      append_to_parent_log=None, force=False):
        """
        Sets the logging directory and updates logger handlers.

        Parameters:
        directory (str, optional): The directory to set for logging. If not provided, defaults to the project's base "logs" directory.
        parent_log_dir (str, optional): The parent directory for logs. If provided, it updates the LoggerFactory's parent log directory.
        append_to_parent_log (bool, optional): If True, appends logs to the parent log directory.
        force (bool, optional): If True, forces the update of the logging directory even if it is already set.

        This function updates the LoggerFactory's logging directory and reconfigures the logger handlers. If the logging directory
        is not provided, it defaults to the project's base "logs" directory. It also handles the creation of the logging directory
        with appropriate permissions and updates the global and individual logger handlers.
        """
        if parent_log_dir:
            LoggerFactory.PARENT_LOG_DIR = parent_log_dir
        if append_to_parent_log:
            LoggerFactory.append_to_parent_log = append_to_parent_log
        with LoggerFactory.lock:
            if not directory:
                directory = file_utils.get_project_base_directory("logs")
            if not LoggerFactory.LOG_DIR or force:
                LoggerFactory.LOG_DIR = directory
            if LoggerFactory.log_share:
                oldmask = os.umask(000)
                os.makedirs(LoggerFactory.LOG_DIR, exist_ok=True)
                os.umask(oldmask)
            else:
                os.makedirs(LoggerFactory.LOG_DIR, exist_ok=True)
            for loggerName, ghandler in LoggerFactory.global_handler_dict.items():
                for className, (logger,
                                handler) in LoggerFactory.logger_dict.items():
                    logger.removeHandler(ghandler)
                ghandler.close()
            LoggerFactory.global_handler_dict = {}
            for className, (logger,
                            handler) in LoggerFactory.logger_dict.items():
                logger.removeHandler(handler)
                _handler = None
                if handler:
                    handler.close()
                if className != "default":
                    _handler = LoggerFactory.get_handler(className)
                    logger.addHandler(_handler)
                LoggerFactory.assemble_global_handler(logger)
                LoggerFactory.logger_dict[className] = logger, _handler
                
    @staticmethod
    def new_logger(name):
        logger = logging.getLogger(name)
        logger.propagate = False
        logger.setLevel(LoggerFactory.LEVEL)
        return logger
    
    @staticmethod
    def get_logger(class_name=None):
        """
        Retrieve or initialize a logger for the specified class name.

        This function checks if a logger for the given class name already exists
        in the LoggerFactory's logger dictionary. If it exists, it returns the
        existing logger. If it does not exist, it initializes a new logger for
        the class name and returns it.

        Args:
            class_name (str, optional): The name of the class for which the logger
                                        is to be retrieved or initialized. Defaults to None.

        Returns:
            logging.Logger: The logger instance for the specified class name.
        """
        with LoggerFactory.lock:
            if class_name in LoggerFactory.logger_dict.keys():
                logger, handler = LoggerFactory.logger_dict[class_name]
                if not logger:
                    logger, handler = LoggerFactory.init_logger(class_name)
            else:
                logger, handler = LoggerFactory.init_logger(class_name)
            return logger

    @staticmethod
    def get_global_handler(logger_name, level=None, log_dir=None):
        """
        Retrieves or creates a global logging handler for the specified logger name.

        Args:
            logger_name (str): The name of the logger.
            level (int, optional): The logging level. Defaults to None.
            log_dir (str, optional): The directory where logs should be stored. Defaults to None.

        Returns:
            logging.Handler: A logging handler instance.

        Notes:
            - If `LoggerFactory.LOG_DIR` is not set, a `logging.StreamHandler` is returned.
            - The handler is cached in `LoggerFactory.global_handler_dict` using a key 
              composed of `logger_name` and `log_dir` (or `LoggerFactory.LOG_DIR` if `log_dir` is not provided).
            - Thread-safe access to the handler dictionary is ensured using `LoggerFactory.lock`.
        """
        if not LoggerFactory.LOG_DIR:
            return logging.StreamHandler()
        if log_dir:
            logger_name_key = logger_name + "_" + log_dir
        else:
            logger_name_key = logger_name + "_" + LoggerFactory.LOG_DIR
        # if loggerName not in LoggerFactory.globalHandlerDict:
        if logger_name_key not in LoggerFactory.global_handler_dict:
            with LoggerFactory.lock:
                if logger_name_key not in LoggerFactory.global_handler_dict:
                    handler = LoggerFactory.get_handler(
                        logger_name, level, log_dir)
                    LoggerFactory.global_handler_dict[logger_name_key] = handler
        return LoggerFactory.global_handler_dict[logger_name_key]

    @staticmethod
    def get_handler(class_name, level=None, log_dir=None,
                    log_type=None, job_id=None):
        """
        Get a logging handler based on the provided parameters.
        Parameters:
        class_name (str): The name of the class for which the log is being created.
        level (int, optional): The logging level (e.g., logging.DEBUG, logging.INFO). Defaults to None.
        log_dir (str, optional): The directory where the log file will be stored. Defaults to None.
        log_type (str, optional): The type of log (e.g., 'error', 'info'). Defaults to None.
        job_id (str, optional): The job identifier. Defaults to None.
        Returns:
        logging.Handler: A configured logging handler instance.
        Notes:
        - If `log_type` is not provided, the log file will be named after the `class_name`.
        - If `log_dir` is not provided, the log file will be stored in the default log directory.
        - If `LoggerFactory.log_share` is True, an `ROpenHandler` will be used; otherwise, a `TimedRotatingFileHandler` will be used.
        - The log file will be rotated daily with a backup count of 14.
        """
        if not log_type:
            if not LoggerFactory.LOG_DIR or not class_name:
                return logging.StreamHandler()
            
            if not log_dir:
                log_file = os.path.join(
                    LoggerFactory.LOG_DIR,
                    "{}.log".format(class_name)
                )
            else:
                log_file = os.path.join(log_dir, "{}.log".format(class_name))
        else:
            log_file = os.path.join(log_dir, "questin_{}.log".format(
                log_type) if level == LoggerFactory.LEVEL else 'questin_{}_error.log'.format(log_type))
            
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        if LoggerFactory.log_share:
            handler = ROpenHandler(log_file,
                                   when='D',
                                   interval=1,
                                   backupCount=14,
                                   delay=True)
        else:
            handler = TimedRotatingFileHandler(log_file,
                                               when='D',
                                               interval=1,
                                               backupCount=14,
                                               delay=True)
        if level:
            handler.level = level

        return handler
    
    @staticmethod
    def init_logger(class_name):
        """
        Initializes a logger for the given class name.
        This function creates a new logger instance for the specified class name
        using the LoggerFactory. It also sets up a handler for the logger and 
        stores the logger and handler in the LoggerFactory's logger dictionary.
        Args:
            class_name (str): The name of the class for which the logger is being initialized.
        Returns:
            tuple: A tuple containing the logger and its handler.
        """
        with LoggerFactory.lock:
            logger = LoggerFactory.new_logger(class_name)
            handler = None
            if class_name:
                handler = LoggerFactory.get_handler(class_name)
                logger.addHandler(handler)
                LoggerFactory.logger_dict[class_name] = logger, handler

            else:
                LoggerFactory.logger_dict["default"] = logger, handler

            LoggerFactory.assemble_global_handler(logger)
            return logger, handler

    @staticmethod
    def assemble_global_handler(logger):
        """
        Configures the provided logger with global handlers based on the LoggerFactory settings.

        This function adds handlers to the logger for each logging level that meets or exceeds
        the LoggerFactory's configured level. If `LoggerFactory.LOG_DIR` is set, handlers are
        added for each level. Additionally, if `LoggerFactory.append_to_parent_log` is True and
        `LoggerFactory.PARENT_LOG_DIR` is set, handlers are also added for each level to the
        parent log directory.

        Args:
            logger (logging.Logger): The logger instance to which handlers will be added.
        """
        if LoggerFactory.LOG_DIR:
            for level in LoggerFactory.levels:
                if level >= LoggerFactory.LEVEL:
                    level_logger_name = logging._levelToName[level]
                    logger.addHandler(
                        LoggerFactory.get_global_handler(
                            level_logger_name, level))
        if LoggerFactory.append_to_parent_log and LoggerFactory.PARENT_LOG_DIR:
            for level in LoggerFactory.levels:
                if level >= LoggerFactory.LEVEL:
                    level_logger_name = logging._levelToName[level]
                    logger.addHandler(
                        LoggerFactory.get_global_handler(level_logger_name, level, LoggerFactory.PARENT_LOG_DIR))


    
class ROpenHandler(TimedRotatingFileHandler):
    """
    ROpenHandler is a custom logging handler that extends TimedRotatingFileHandler.
    It temporarily changes the file creation umask to 000 to ensure that the log files
    are created with the desired permissions.

    Methods:
        _open(): Overrides the _open method of TimedRotatingFileHandler to set the umask
                 to 000 before opening the file and then restores the previous umask.
    """
    def _open(self):
        prevumask = os.umask(000)
        rtv = TimedRotatingFileHandler._open(self)
        os.umask(prevumask)
        return rtv
    

def getLogger(className=None, useLevelFile=False):
    """
    Retrieves a logger instance for the specified class name.

    Args:
        className (str, optional): The name of the class for which the logger is being retrieved. 
                                   If None, defaults to 'stat'.
        useLevelFile (bool, optional): Flag indicating whether to use a level file for logging. 
                                       Currently not used in the function.

    Returns:
        logging.Logger: A logger instance for the specified class name.
    """
    if className is None:
        frame = inspect.stack()[1]
        module = inspect.getmodule(frame[0])
        className = 'stat'
    return LoggerFactory.get_logger(className)