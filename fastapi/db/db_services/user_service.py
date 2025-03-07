from datetime import datetime

import peewee

from db.conn import DB
from db.db_services.common_service import CommonService
from db.models.user_models import User, UserTenant
from db.constants import StatusEnum, UserTenantRole

from utils.pass_utils import generate_password_hash, check_password_hash
from utils import datetime_format, current_timestamp, get_uuid

class UserService(CommonService):
    """
    UserService provides various methods to interact with the User model in the database.
    Methods:
        filter_by_id(user_id):
            Filters and retrieves a user by their ID.
                user_id (str): The ID of the user to retrieve.
                User: The user object if found, otherwise None.
        query_user(email, password):
            Queries and retrieves a user by their email and password.
                email (str): The email of the user.
                password (str): The password of the user.
                User: The user object if the email and password match, otherwise None.
        save(**kwargs):
            Saves a new user to the database.
                **kwargs: Arbitrary keyword arguments containing user details.
                User: The saved user object.
        delete_user(user_ids, update_user_dict):
        update_user(user_id, user_dict):
            Updates user information in the database.
                user_id (str): The ID of the user to update.
                user_dict (dict): A dictionary containing user update information.
    """
    model = User
    
    @classmethod
    @DB.connection_context()
    def filter_by_id(cls, user_id):
        try:
            user = cls.model.select().where(cls.model.id == user_id).get()
            return user
        except peewee.DoesNotExist:
            return None
        
    @classmethod
    @DB.connection_context()
    def query_user(cls, email, password):
        user = cls.model.select().where((cls.model.email == email),
                                        (cls.model.status == StatusEnum.VALID.value)).first()
        if user and check_password_hash(str(user.password), password):
            return user
        else:
            return None
        
    @classmethod
    @DB.connection_context()
    def save(cls, **kwargs):
        if "id" not in kwargs:
            kwargs["id"] = get_uuid()
        if "password" in kwargs:
            kwargs["password"] = generate_password_hash(
                str(kwargs["password"]))

        kwargs["create_time"] = current_timestamp()
        kwargs["create_date"] = datetime_format(datetime.now())
        kwargs["update_time"] = current_timestamp()
        kwargs["update_date"] = datetime_format(datetime.now())
        obj = cls.model(**kwargs).save(force_insert=True)
        return obj
    
    @classmethod
    @DB.connection_context()
    def delete_user(cls, user_ids, update_user_dict):
        """
        Deletes users by setting their status to 0.

        Args:
            user_ids (list): A list of user IDs to be deleted.
            update_user_dict (dict): A dictionary containing user update information.

        Returns:
            None
        """
        with DB.atomic():
            cls.model.update({"status": 0}).where(
                cls.model.id.in_(user_ids)).execute()
            
    @classmethod
    @DB.connection_context()
    def update_user(cls, user_id, user_dict):
        with DB.atomic():
            if user_dict:
                user_dict["update_time"] = current_timestamp()
                user_dict["update_date"] = datetime_format(datetime.now())
                cls.model.update(user_dict).where(
                    cls.model.id == user_id).execute()

class UserTenantService(CommonService):
    model = UserTenant
    
    @classmethod
    @DB.connection_context()
    def save(cls, **kwargs):
        if "id" not in kwargs:
            kwargs["id"] = get_uuid()
        obj = cls.model(**kwargs).save(force_insert=True)
        return obj
    
    @classmethod
    @DB.connection_context()
    def get_by_tenant_id(cls, tenant_id):
        fields = [
            cls.model.user_id,
            cls.model.status,
            cls.model.role,
            User.nickname,
            User.email,
            User.avatar,
            User.is_authenticated,
            User.is_active,
            User.is_anonymous,
            User.status,
            User.update_date,
            User.is_superuser]
        return list(cls.model.select(*fields)
                    .join(User, on=((cls.model.user_id == User.id) & (cls.model.status == StatusEnum.VALID.value) & (cls.model.role != UserTenantRole.OWNER)))
                    .where(cls.model.tenant_id == tenant_id)
                    .dicts())

    @classmethod
    @DB.connection_context()
    def get_tenants_by_user_id(cls, user_id):
        fields = [
            cls.model.tenant_id,
            cls.model.role,
            User.nickname,
            User.email,
            User.avatar,
            User.update_date
        ]
        return list(cls.model.select(*fields)
                    .join(User, on=((cls.model.tenant_id == User.id) & (UserTenant.user_id == user_id) & (UserTenant.status == StatusEnum.VALID.value)))
                    .where(cls.model.status == StatusEnum.VALID.value).dicts())
