from db.conn import DB
from peewee import (
    BigIntegerField, DateTimeField, Model,
    Metadata, CompositeKey
)
from db import db_utils
import utils
import operator

class BaseModel(Model):
    """BaseModel is an abstract class that extends the Model class and provides additional functionality for handling
    timestamps, converting model instances to dictionaries, and querying the database with various filters.
    Attributes:
        create_time (BigIntegerField): The timestamp when the record was created.
        create_date (DateTimeField): The date and time when the record was created.
        update_time (BigIntegerField): The timestamp when the record was last updated.
        update_date (DateTimeField): The date and time when the record was last updated.
    Methods:
        to_json(self):
            Converts the model instance to a JSON-compatible dictionary.
        to_dict(self):
        to_human_model_dict(self, only_primary_with: list = None):
        meta(self) -> Metadata:
        get_primary_keys_name(cls):
        getter_by(cls, attr):
        query(cls, reverse=None, order_by=None, **kwargs):
        insert(cls, __data=None, **insert):
        _normalize_data(cls, data, kwargs):"""
    create_time = BigIntegerField(null=True)
    create_date = DateTimeField(null=True)
    update_time = BigIntegerField(null=True)
    update_date = DateTimeField(null=True)
    
    def to_json(self):
        return self.to_dict()
    
    def to_dict(self):
        """
        Converts the model instance to a dictionary.

        Returns:
            dict: A dictionary representation of the model instance.
        """
        return self.__dict__['__data__']
    
    def to_human_model_dict(self, only_primary_with: list = None):
        """
        Converts the model instance to a dictionary with human-readable keys.
        Args:
            only_primary_with (list, optional): A list of additional fields to include in the output dictionary.
            If not provided, all fields will be included.
        Returns:
            dict: A dictionary representation of the model instance with human-readable keys. If `only_primary_with`
            is provided, the dictionary will include only the primary key fields and the specified additional fields.
        """
        model_dict = self.__dict__['__data__']
        
        if not only_primary_with:
            return {db_utils.remove_field_name_prefix(
                k): v for k, v in model_dict.items()}

        human_model_dict = {}
        for k in self._meta.primary_key.field_names:
            human_model_dict[db_utils.remove_field_name_prefix(k)] = model_dict[k]
        for k in only_primary_with:
            human_model_dict[k] = model_dict[f'f_{k}']
        return human_model_dict

    @property
    def meta(self) -> Metadata:
        """
        Retrieve the metadata associated with the instance.

        Returns:
            Metadata: The metadata object associated with the instance.
        """
        return self._meta
    
    @classmethod
    def get_primary_keys_name(cls):
        """
        Retrieve the names of the primary keys for the given class.

        Returns:
            list: A list containing the names of the primary keys. If the primary key is a composite key,
                  it returns the field names of the composite key. Otherwise, it returns a list with the
                  name of the primary key.
        """
        return cls._meta.primary_key.field_names if isinstance(cls._meta.primary_key, CompositeKey) else [
            cls._meta.primary_key.name]
    
    @classmethod
    def getter_by(cls, attr):
        """
        Retrieve the value of a specified attribute from the class.

        Args:
            cls: The class from which to retrieve the attribute.
            attr (str): The name of the attribute to retrieve.

        Returns:
            The value of the specified attribute from the class.
        """
        return operator.attrgetter(attr)(cls)
    
    @classmethod
    def query(cls, reverse=None, order_by=None, **kwargs):
        """
        Query the database for records that match the given filters.

        Args:
            cls (Type): The class representing the database table.
            reverse (bool, optional): If True, results are ordered in descending order. 
                                      If False, results are ordered in ascending order.
                                      If None, no ordering is applied. Defaults to None.
            order_by (str, optional): The attribute name to order the results by. 
                                      Defaults to "create_time" if not provided or invalid.
            **kwargs: Arbitrary keyword arguments representing the filters to apply. 
                      The key is the attribute name and the value is the filter value.
                      If the value is a list or set, it will be treated as a range or 
                      a set of possible values.

        Returns:
            List: A list of records that match the given filters and ordering.
                  If no filters are provided, an empty list is returned.

        Notes:
            - If a filter value is None, that filter is ignored.
            - If a filter value is a list or set and the attribute is a continuous field,
              it is treated as a range with two values (lower and upper bounds).
            - If a filter value is a list or set and the attribute is not a continuous field,
              it is treated as a set of possible values.
            - If the attribute is a date or timestamp field, string values are converted 
              to timestamps.
        """
        filters = []
        for f_n, f_v in kwargs.items():
            attr_name = '%s' % f_n
            if not hasattr(cls, attr_name) or f_v is None:
                continue
            if type(f_v) in {list, set}:
                f_v = list(f_v)
                if db_utils.is_continuous_field(type(getattr(cls, attr_name))):
                    if len(f_v) == 2:
                        for i, v in enumerate(f_v):
                            if isinstance(
                                    v, str) and f_n in db_utils.auto_date_timestamp_field():
                                # time type: %Y-%m-%d %H:%M:%S
                                f_v[i] = utils.date_string_to_timestamp(v)
                        lt_value = f_v[0]
                        gt_value = f_v[1]
                        if lt_value is not None and gt_value is not None:
                            filters.append(
                                cls.getter_by(attr_name).between(
                                    lt_value, gt_value))
                        elif lt_value is not None:
                            filters.append(
                                operator.attrgetter(attr_name)(cls) >= lt_value)
                        elif gt_value is not None:
                            filters.append(
                                operator.attrgetter(attr_name)(cls) <= gt_value)
                else:
                    filters.append(operator.attrgetter(attr_name)(cls) << f_v)
            else:
                filters.append(operator.attrgetter(attr_name)(cls) == f_v)
        if filters:
            query_records = cls.select().where(*filters)
            if reverse is not None:
                if not order_by or not hasattr(cls, f"{order_by}"):
                    order_by = "create_time"
                if reverse is True:
                    query_records = query_records.order_by(
                        cls.getter_by(f"{order_by}").desc())
                elif reverse is False:
                    query_records = query_records.order_by(
                        cls.getter_by(f"{order_by}").asc())
            return [query_record for query_record in query_records]
        else:
            return []
        
    @classmethod
    def insert(cls, __data=None, **insert):
        """
        Inserts data into the database with an automatic timestamp.
        Args:
            __data (dict, optional): The data to be inserted. If provided, it must be a dictionary.
            **insert: Additional keyword arguments to be inserted.
        Returns:
            The result of the insert operation from the superclass.
        Notes:
            - If `__data` is a dictionary and not empty, it will be updated with the current timestamp under the key `create_time`.
            - If additional keyword arguments are provided, they will also be updated with the current timestamp under the key `create_time`.
        """
        if isinstance(__data, dict) and __data:
            __data[cls._meta.combined["create_time"]
                   ] = utils.current_timestamp()
        if insert:
            insert["create_time"] = utils.current_timestamp()

        return super().insert(__data, **insert)

    # update and insert will call this method
    @classmethod
    def _normalize_data(cls, data, kwargs):
        """
        Normalize the provided data by updating timestamps and converting time fields to date fields.
        This method updates the `update_time` field with the current timestamp and converts any 
        time fields with a specific prefix to their corresponding date fields if they are present 
        and not None.
        Args:
            data (dict): The data to be normalized.
            kwargs (dict): Additional keyword arguments.
        Returns:
            dict: The normalized data with updated timestamps and converted date fields.
        """
        normalized = super()._normalize_data(data, kwargs)
        if not normalized:
            return {}

        normalized[cls._meta.combined["update_time"]
                   ] = utils.current_timestamp()

        for f_n in db_utils.AUTO_DATE_TIMESTAMP_FIELD_PREFIX:
            if {f"{f_n}_time", f"{f_n}_date"}.issubset(cls._meta.combined.keys()) and \
                    cls._meta.combined[f"{f_n}_time"] in normalized and \
                    normalized[cls._meta.combined[f"{f_n}_time"]] is not None:
                normalized[cls._meta.combined[f"{f_n}_date"]] = utils.timestamp_to_date(
                    normalized[cls._meta.combined[f"{f_n}_time"]])

        return normalized
    
class DataBaseModel(BaseModel):
    """
    DataBaseModel is a base class for database models.

    Attributes:
        Meta (class): Contains metadata for the database model, including the database connection.
    """
    class Meta:
        database = DB