from datetime import datetime

import peewee

from db.conn import DB
from utils import datetime_format, current_timestamp, get_uuid

class CommonService:
    """
    CommonService class provides a set of class methods to interact with the database using the Peewee ORM.
    It includes methods for querying, retrieving, inserting, updating, and deleting records.
    Attributes:
        model: The model class that this service will operate on.
    Methods:
        query(cls, cols=None, reverse=None, order_by=None, **kwargs):
            Executes a query on the model with optional columns, order, and filters.
        get_all(cls, cols=None, reverse=None, order_by=None):
            Retrieves all records from the model with optional columns and ordering.
        get(cls, **kwargs):
            Retrieves a single record from the model based on the provided filters.
        get_or_none(cls, **kwargs):
            Retrieves a single record from the model based on the provided filters, or returns None if not found.
        save(cls, **kwargs):
            Saves a new record to the model with the provided data.
        insert(cls, **kwargs):
            Inserts a new record to the model with the provided data, generating IDs and timestamps if necessary.
        insert_many(cls, data_list, batch_size=100):
            Inserts multiple records to the model in batches, generating timestamps for each record.
        update_many_by_id(cls, data_list):
            Updates multiple records in the model based on their IDs with the provided data.
        update_by_id(cls, pid, data):
            Updates a single record in the model based on its ID with the provided data.
        get_by_id(cls, pid):
            Retrieves a single record from the model based on its ID.
        get_by_ids(cls, pids, cols=None):
            Retrieves multiple records from the model based on their IDs with optional columns.
        delete_by_id(cls, pid):
            Deletes a single record from the model based on its ID.
        filter_delete(cls, filters):
            Deletes records from the model based on the provided filters.
        filter_update(cls, filters, update_data):
            Updates records in the model based on the provided filters with the provided data.
        cut_list(tar_list, n):
            Splits a list into smaller lists of a specified size.
        filter_scope_list(cls, in_key, in_filters_list, filters=None, cols=None):
            Retrieves records from the model based on a list of filter values and additional filters, with optional columns.
    """
    model = None
    
    
    @classmethod
    @DB.connection_context()
    def query(cls, cols=None, reverse=None, order_by=None, **kwargs):
        return cls.model.query(cols=cols, reverse=reverse,
                               order_by=order_by, **kwargs)
        
    @classmethod
    @DB.connection_context()
    def get_all(cls, cols=None, reverse=None, order_by=None):
        if cols:
            query_records = cls.model.select(*cols)
        else:
            query_records = cls.model.select()
        if reverse is not None:
            if not order_by or not hasattr(cls, order_by):
                order_by = "create_time"
            if reverse is True:
                query_records = query_records.order_by(
                    cls.model.getter_by(order_by).desc())
            elif reverse is False:
                query_records = query_records.order_by(
                    cls.model.getter_by(order_by).asc())
        return query_records
    
    @classmethod
    @DB.connection_context()
    def get(cls, **kwargs):
        return cls.model.get(**kwargs)

    @classmethod
    @DB.connection_context()
    def get_or_none(cls, **kwargs):
        try:
            return cls.model.get(**kwargs)
        except peewee.DoesNotExist:
            return None
        
    @classmethod
    @DB.connection_context()
    def save(cls, **kwargs):
        # if "id" not in kwargs:
        #    kwargs["id"] = get_uuid()
        sample_obj = cls.model(**kwargs).save(force_insert=True)
        return sample_obj
    
    @classmethod
    @DB.connection_context()
    def insert(cls, **kwargs):
        if "id" not in kwargs:
            kwargs["id"] = get_uuid()
        kwargs["create_time"] = current_timestamp()
        kwargs["create_date"] = datetime_format(datetime.now())
        kwargs["update_time"] = current_timestamp()
        kwargs["update_date"] = datetime_format(datetime.now())
        sample_obj = cls.model(**kwargs).save(force_insert=True)
        return sample_obj
    
    @classmethod
    @DB.connection_context()
    def insert_many(cls, data_list, batch_size=100):
        with DB.atomic():
            for d in data_list:
                d["create_time"] = current_timestamp()
                d["create_date"] = datetime_format(datetime.now())
            for i in range(0, len(data_list), batch_size):
                cls.model.insert_many(data_list[i:i + batch_size]).execute()

    @classmethod
    @DB.connection_context()
    def update_many_by_id(cls, data_list):
        with DB.atomic():
            for data in data_list:
                data["update_time"] = current_timestamp()
                data["update_date"] = datetime_format(datetime.now())
                cls.model.update(data).where(
                    cls.model.id == data["id"]).execute()

    @classmethod
    @DB.connection_context()
    def update_by_id(cls, pid, data):
        data["update_time"] = current_timestamp()
        data["update_date"] = datetime_format(datetime.now())
        num = cls.model.update(data).where(cls.model.id == pid).execute()
        return num

    @classmethod
    @DB.connection_context()
    def get_by_id(cls, pid):
        try:
            obj = cls.model.query(id=pid)[0]
            return True, obj
        except Exception as e:
            return False, None

    @classmethod
    @DB.connection_context()
    def get_by_ids(cls, pids, cols=None):
        if cols:
            objs = cls.model.select(*cols)
        else:
            objs = cls.model.select()
        return objs.where(cls.model.id.in_(pids))

    @classmethod
    @DB.connection_context()
    def delete_by_id(cls, pid):
        return cls.model.delete().where(cls.model.id == pid).execute()

    @classmethod
    @DB.connection_context()
    def filter_delete(cls, filters):
        with DB.atomic():
            num = cls.model.delete().where(*filters).execute()
            return num

    @classmethod
    @DB.connection_context()
    def filter_update(cls, filters, update_data):
        with DB.atomic():
            return cls.model.update(update_data).where(*filters).execute()

    @staticmethod
    def cut_list(tar_list, n):
        length = len(tar_list)
        arr = range(length)
        result = [tuple(tar_list[x:(x + n)]) for x in arr[::n]]
        return result

    @classmethod
    @DB.connection_context()
    def filter_scope_list(cls, in_key, in_filters_list,
                          filters=None, cols=None):
        in_filters_tuple_list = cls.cut_list(in_filters_list, 20)
        if not filters:
            filters = []
        res_list = []
        if cols:
            for i in in_filters_tuple_list:
                query_records = cls.model.select(
                    *
                    cols).where(
                    getattr(
                        cls.model,
                        in_key).in_(i),
                    *
                    filters)
                if query_records:
                    res_list.extend(
                        [query_record for query_record in query_records])
        else:
            for i in in_filters_tuple_list:
                query_records = cls.model.select().where(
                    getattr(cls.model, in_key).in_(i), *filters)
                if query_records:
                    res_list.extend(
                        [query_record for query_record in query_records])
        return res_list
