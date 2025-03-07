from db.models import DataBaseModel
from peewee import (
    CharField, TextField, DateTimeField,
    BooleanField
)
from itsdangerous.url_safe import URLSafeTimedSerializer as Serializer
from db.settings import SECRET_KEY

class User(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    access_token = CharField(max_length=255, null=True)
    nickname = CharField(max_length=100, null=False, help_text="nicky name")
    password = CharField(max_length=255, null=False, help_text="password")
    email = CharField(
        max_length=255,
        null=False,
        help_text="email",
        index=True
    )
    avatar = TextField(null=True, help_text="avatar base64 string")
    language = CharField(
        max_length=32,
        null=True,
        help_text="English|Vietnamese",
        default="Vietnamese")
    color_schema = CharField(
        max_length=32,
        null=True,
        help_text="Bright|Dark",
        default="Bright"
    )
    timezone = CharField(
        max_length=64,
        null=True,
        help_text="Timezone",
        default="UTC+7\tAsia/Ho_Chi_Minh"
    )
    last_login_time = DateTimeField(null=True)
    is_authenticated = CharField(max_length=1, null=False, default="1")
    is_active = CharField(max_length=1, null=False, default="1")
    is_anonymous = CharField(max_length=1, null=False, default="0")
    login_channel = CharField(null=True, help_text="from which user login")
    status = CharField(
        max_length=1,
        null=True,
        help_text="is it validate(0: wasted, 1: validate)",
        default="1"
    )
    is_superuser = BooleanField(null=True, help_text="is root", default=False)
    #long-term-memory
    def __str__(self):
        return self.email
    
    def get_id(self):
        jwt = Serializer(secret_key=SECRET_KEY)
        return jwt.dumps(str(self.access_token))
    
    class Meta:
        db_table = "user"
        
class UserTenant(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    user_id = CharField(max_length=32, null=False, index=True)
    tenant_id = CharField(max_length=32, null=False, index=True)
    role = CharField(max_length=32, null=False, help_text="UserTenantRole", index=True)
    invited_by = CharField(max_length=32, null=False, index=True)
    status = CharField(
        max_length=1,
        null=True,
        help_text="is it validate(0: wasted, 1:validate)",
        default="1",
        index=True
    )
    
    class Meta:
        db_table = "user_tenant"
        
class InvitationCode(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    code = CharField(max_length=32, null=False, index=True)
    visit_time = DateTimeField(null=True, index=True)
    user_id = CharField(max_length=32, null=True, index=True)
    tenant_id = CharField(max_length=32, null=True, index=True)
    status = CharField(
        max_length=1,
        null=True,
        help_text="is it validate(0: wasted，1: validate)",
        default="1",
        index=True)

    class Meta:
        db_table = "invitation_code"