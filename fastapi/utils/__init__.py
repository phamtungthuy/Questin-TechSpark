import base64
from utils import file_utils
import datetime
import uuid
import os
import importlib
import time
import json
from enum import Enum, IntEnum

from Cryptodome.PublicKey import RSA
from Cryptodome.Cipher import PKCS1_v1_5 as Cipher_pkcs1_v1_5

SERVICE_CONF = "service_conf.yaml"

def conf_realpath(conf_name: str) -> str:
    """
    Generate the absolute path for a given configuration file name.

    Args:
        conf_name (str): The name of the configuration file.

    Returns:
        str: The absolute path to the configuration file.
    """
    conf_path = f"conf/{conf_name}"
    return os.path.join(file_utils.get_project_base_directory(), conf_path)

def get_base_config(key: str, default=None, conf_name=SERVICE_CONF):
    """
    Retrieve a configuration value from a YAML configuration file.
    This function attempts to load a configuration value from a local YAML
    configuration file first. If the local configuration file does not exist
    or does not contain the specified key, it falls back to a default
    configuration file. If the key is not found in either configuration file,
    it returns the provided default value or the value from the environment
    variable.
    Args:
        key (str): The configuration key to retrieve.
        default (Any, optional): The default value to return if the key is not found.
                                 Defaults to None.
        conf_name (str, optional): The name of the configuration file to load.
                                   Defaults to SERVICE_CONF.
    Returns:
        Any: The value associated with the specified key, or the default value
             if the key is not found.
    Raises:
        ValueError: If the configuration file is invalid or not a dictionary.
    """
    local_config = {}
    local_path = conf_realpath(f'local.{conf_name}')
    if default is None:
        default = os.environ.get(key.upper())
    
    if os.path.exists(local_path):
        local_config = file_utils.load_yaml_conf(local_path)
        if not isinstance(local_config, dict):
            raise ValueError(f'Invalid config file: "{local_path}".')

        if key is not None and key in local_config:
            return local_config[key]
    
    config_path = conf_realpath(conf_name)
    config = file_utils.load_yaml_conf(config_path)
    
    if not isinstance(config, dict):
        raise ValueError(f'Invalid config file: "{config_path}".')

    config.update(local_config)
    return config.get(key, default) if key is not None else config

def decrypt_database_password(password: str) -> str:
    """
    Decrypts the given database password using the specified encryption module and private key.
    This function retrieves the encryption settings from the base configuration, including
    whether encryption is enabled, the encryption module to use, and the private key. If the
    password or encryption is not enabled, it returns the password as is. If the private key
    is not available, it raises a ValueError. Otherwise, it uses the specified encryption
    module and private key to decrypt the password.
    Args:
        password (str): The encrypted database password.
    Returns:
        str: The decrypted database password.
    Raises:
        ValueError: If the private key is not available.
    """
    encrypt_password = get_base_config("encrypt_password", False)
    encrypt_module = get_base_config("encrypt_module", False)
    private_key = get_base_config("private_key", False)
    
    if not password or not encrypt_password:
        return password
    
    if not private_key:
        raise ValueError("No private key")

    module_fun = encrypt_module.split("#")
    pwdecrypt_fun = getattr(
        importlib.import_module(
            module_fun[0]),
        module_fun[1])

    return pwdecrypt_fun(private_key, password)

def decrypt_database_config(
    database=None, passwd_key="password", name="database"):
    """
    Decrypts the database password in the given database configuration.
    Args:
        database (dict, optional): The database configuration dictionary. 
            If not provided, it will be fetched using `get_base_config`.
        passwd_key (str, optional): The key in the database dictionary 
            that holds the encrypted password. Defaults to "password".
        name (str, optional): The name of the database configuration to fetch 
            if `database` is not provided. Defaults to "database".
    Returns:
        dict: The database configuration dictionary with the decrypted password.
    """
    if not database:
        database = get_base_config(name, {})
    
    database[passwd_key] = decrypt_database_password(database[passwd_key])
    return database

def current_timestamp():
    return int(time.time() * 1000)

def timestamp_to_date(timestamp, format_string="%Y-%m-%d %H:%M:%S"):
    if not timestamp:
        timestamp = time.time()
    timestamp = int(timestamp) / 1000
    time_array = time.localtime(timestamp)
    str_date = time.strftime(format_string, time_array)
    return str_date

def date_string_to_timestamp(time_str, format_string="%Y-%m-%d %H:%M:%S"):
    time_array = time.strptime(time_str, format_string)
    time_stamp = int(time.mktime(time_array) * 1000)
    return time_stamp

def get_uuid():
    return uuid.uuid1().hex

def datetime_format(date_time: datetime.datetime) -> datetime.datetime:
    return datetime.datetime(date_time.year, date_time.month, date_time.day,
                             date_time.hour, date_time.minute, date_time.second)

def get_format_time() -> datetime.datetime:
    return datetime_format(datetime.datetime.now())

def decrypt(line):
    """
    Decrypts a given base64 encoded string using RSA encryption.

    Args:
        line (str): The base64 encoded string to be decrypted.

    Returns:
        str: The decrypted string in UTF-8 format.

    Raises:
        ValueError: If the decryption fails, raises a ValueError with the message "Fail to decrypt password!".
    """
    file_path = os.path.join(
        file_utils.get_project_base_directory(),
        "conf",
        "private.pem")
    rsa_key = RSA.importKey(open(file_path).read(), "Welcome")
    cipher = Cipher_pkcs1_v1_5.new(rsa_key)
    return cipher.decrypt(base64.b64decode(
        line), "Fail to decrypt password!").decode('utf-8')

def download_img(url):
    import requests
    if not url:
        return ""
    response = requests.get(url)
    return "data:" + \
           response.headers.get('Content-Type', 'image/jpg') + ";" + \
           "base64," + base64.b64encode(response.content).decode("utf-8")


class BaseType:
    def to_dict(self):
        return dict([(k.lstrip("_"), v) for k, v in self.__dict__.items()])

    def to_dict_with_type(self):
        def _dict(obj):
            module = None
            if issubclass(obj.__class__, BaseType):
                data = {}
                for attr, v in obj.__dict__.items():
                    k = attr.lstrip("_")
                    data[k] = _dict(v)
                module = obj.__module__
            elif isinstance(obj, (list, tuple)):
                data = []
                for i, vv in enumerate(obj):
                    data.append(_dict(vv))
            elif isinstance(obj, dict):
                data = {}
                for _k, vv in obj.items():
                    data[_k] = _dict(vv)
            else:
                data = obj
            return {"type": obj.__class__.__name__,
                    "data": data, "module": module}
        return _dict(self)

class CustomJSONEncoder(json.JSONEncoder):
    def __init__(self, **kwargs):
        self._with_type = kwargs.pop("with_type", False)
        super().__init__(**kwargs)

    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.strftime('%Y-%m-%d %H:%M:%S')
        elif isinstance(obj, datetime.date):
            return obj.strftime('%Y-%m-%d')
        elif isinstance(obj, datetime.timedelta):
            return str(obj)
        elif issubclass(type(obj), Enum) or issubclass(type(obj), IntEnum):
            return obj.value
        elif isinstance(obj, set):
            return list(obj)
        elif issubclass(type(obj), BaseType):
            if not self._with_type:
                return obj.to_dict()
            else:
                return obj.to_dict_with_type()
        elif isinstance(obj, type):
            return obj.__name__
        else:
            return json.JSONEncoder.default(self, obj)


def string_to_bytes(string):
    return string if isinstance(
        string, bytes) else string.encode(encoding="utf-8")

def bytes_to_string(byte):
    return byte.decode(encoding="utf-8")

def json_dumps(src, byte=False, indent=None, with_type=False):
    dest = json.dumps(
        src,
        indent=indent,
        cls=CustomJSONEncoder,
        with_type=with_type,
        ensure_ascii=False
    )
    if byte:
        dest = string_to_bytes(dest)
    return dest

def json_loads(src, object_hook=None, object_pairs_hook=None):
    if isinstance(src, bytes):
        src = bytes_to_string(src)
    return json.loads(src, object_hook=object_hook,
                      object_pairs_hook=object_pairs_hook)
