from db.models import DataBaseModel
from peewee import (
    CharField, IntegerField
)

class File(DataBaseModel):
    id = CharField(
        max_length=32,
        primary_key=True)
    parent_id = CharField(
        max_length=32,
        null=False,
        help_text="parent folder id",
        index=True)
    tenant_id = CharField(
        max_length=32,
        null=False,
        help_text="tenant id",
        index=True)
    created_by = CharField(
        max_length=32,
        null=False,
        help_text="who created it",
        index=True)
    name = CharField(
        max_length=255,
        null=False,
        help_text="file name or folder name",
        index=True)
    location = CharField(
        max_length=255,
        null=True,
        help_text="where dose it store",
        index=True)
    size = IntegerField(default=0, index=True)
    type = CharField(max_length=32, null=False, help_text="file extension", index=True)
    source_type = CharField(
        max_length=128,
        null=False,
        default="",
        help_text="where dose this document come from", index=True)

    class Meta:
        db_table = "file"

class File2Document(DataBaseModel):
    id = CharField(
        max_length=32,
        primary_key=True)
    file_id = CharField(
        max_length=32,
        null=True,
        help_text="file id",
        index=True)
    document_id = CharField(
        max_length=32,
        null=True,
        help_text="document id",
        index=True)

    class Meta:
        db_table = "file2document"
