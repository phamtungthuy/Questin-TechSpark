import pathlib
import re
import typing
from peewee import (
    IntegerField, Field,
    FloatField, DateTimeField,
    TextField
)
from playhouse.pool import PooledMySQLDatabase
from enum import Enum
from db.settings import DATABASE_TYPE
import utils
from utils import current_timestamp, timestamp_to_date
from db.conn import DB

@DB.connection_context()
def bulk_insert_into_db(model, data_source, replace_on_conflict=False):
    """
    Bulk inserts data into the specified database model.
    This function creates the necessary tables for the given model and then
    inserts data from the provided data source in batches. It also handles
    timestamp and date fields for each record.
    Args:
        model (peewee.Model): The database model into which data will be inserted.
        data_source (list of dict): A list of dictionaries containing the data to be inserted.
        replace_on_conflict (bool, optional): If True, existing records will be replaced on conflict.
            Defaults to False.
    Raises:
        peewee.IntegrityError: If there is an integrity error during the insert operation.
    Notes:
        - The function assumes that the `DB` object and `current_timestamp`, `timestamp_to_date`
          functions are defined elsewhere in the code.
        - The `DB` object should be an instance of a Peewee database.
        - The `data_source` should be a list of dictionaries where each dictionary represents a record.
        - The function processes the data in batches of 1000 records to optimize performance.
    """
    DB.create_tables([model])
    
    for i, data in enumerate(data_source):
        current_time = current_timestamp() + i
        current_date = timestamp_to_date(current_time)
        if 'create_time' not in data:
            data['create_time'] = current_time
        data['create_date'] = timestamp_to_date(data['create_time'])
        data['update_time'] = current_time
        data['update_date'] = current_date

    preserve = tuple(data_source[0].keys() - {'create_time', 'create_date'})

    batch_size = 1000

    for i in range(0, len(data_source), batch_size):
        with DB.atomic():
            query = model.insert_many(data_source[i:i + batch_size])
            if replace_on_conflict:
                if isinstance(DB, PooledMySQLDatabase):
                    query = query.on_conflict(preserve=preserve)
                else:
                    query = query.on_conflict(conflict_target="id", preserve=preserve)
            query.execute()

CONTINUOUS_FIELD_TYPE = {IntegerField, FloatField, DateTimeField}
AUTO_DATE_TIMESTAMP_FIELD_PREFIX = {
    "create",
    "start",
    "end",
    "update",
    "read_access",
    "write_access"}

def remove_field_name_prefix(field_name):
    return field_name[2:] if field_name.startswith('f_') else field_name

def auto_date_timestamp_field():
    return {f"{f}_time" for f in AUTO_DATE_TIMESTAMP_FIELD_PREFIX}

def auto_date_timestamp_db_field():
    return {f"f_{f}_time" for f in AUTO_DATE_TIMESTAMP_FIELD_PREFIX}

def is_continuous_field(cls: typing.Type) -> bool:
    """
    Determines if a given class type is considered a continuous field.

    A class type is considered a continuous field if it is directly in the 
    CONTINUOUS_FIELD_TYPE set or if any of its base classes (excluding Field 
    and object) are in the CONTINUOUS_FIELD_TYPE set.

    Args:
        cls (typing.Type): The class type to check.

    Returns:
        bool: True if the class type is a continuous field, False otherwise.
    """
    if cls in CONTINUOUS_FIELD_TYPE:
        return True
    for p in cls.__bases__:
        if p in CONTINUOUS_FIELD_TYPE:
            return True
        elif p != Field and p != object:
            if is_continuous_field(p):
                return True
    else:
        return False
    
def duplicate_name(query_func, **kwargs):
    fnm = kwargs["name"]
    objs = query_func(**kwargs)
    if not objs: return fnm
    ext = pathlib.Path(fnm).suffix
    nm = re.sub(r"%s$"%ext, "", fnm)
    r = re.search(r"\(([0-9]+)\)$", nm)
    c = 0
    if r:
        c = int(r.group(1))
        nm = re.sub(r"\([0-9]+\)$", "", nm)
    c += 1
    nm = f"{nm}({c})"
    if ext: nm += f"{ext}"

    kwargs["name"] = nm
    return duplicate_name(query_func, **kwargs)


    
class TextFieldType(Enum):
    MYSQL = 'LONGTEXT'
    POSTGRES = 'TEXT'

    
class LongTextField(TextField):
    field_type = TextFieldType[DATABASE_TYPE.upper()].value
    
class JSONField(LongTextField):
    default_value = {}

    def __init__(self, object_hook=None, object_pairs_hook=None, **kwargs):
        self._object_hook = object_hook
        self._object_pairs_hook = object_pairs_hook
        super().__init__(**kwargs)

    def db_value(self, value):
        if value is None:
            value = self.default_value
        return utils.json_dumps(value)

    def python_value(self, value):
        if not value:
            return self.default_value
        return utils.json_loads(
            value, object_hook=self._object_hook, object_pairs_hook=self._object_pairs_hook)
