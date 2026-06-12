"""Fix: ALTER COLUMN loai from VARCHAR(10) to VARCHAR(30) in the actual DB.

Migration 0002 used SeparateDatabaseAndState to update max_length=30 in
Django's state ONLY, with database_operations=[] — so the column stayed
as VARCHAR(10). This migration fixes the actual database column.
"""
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('products', '0006_add_hinh_anh_field'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE products ALTER COLUMN loai TYPE VARCHAR(30);",
            reverse_sql="ALTER TABLE products ALTER COLUMN loai TYPE VARCHAR(10);",
        ),
    ]
