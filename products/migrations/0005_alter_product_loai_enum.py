"""ALTER ENUM product_loai — thêm 31 giá trị mới cho các danh mục phụ tùng."""
from django.db import migrations

NEW_LOAI_VALUES = [
    'piston', 'sec_mang', 'xy_lanh', 'bo_hoi',
    'ron_bo', 'ron_mieng', 'ron_cat_te',
    'mieng_bac', 'can_thau',
    'phot_dau', 'phot_duoi',
    'thun_co', 'thun_xy_lanh',
    'supap', 'truc_co', 'bom_nuoc', 'nap_quy_lat', 'bom_nhot',
    'truc_cam', 'nap_sinh_han', 'ruot_sinh_han', 'ket_nuoc',
    'nhip_tay_bien', 'sam_bac', 'loc_may',
    'van_hang_nhiet', 'vanh_rang_banh_da',
    'ong_dan_nhien_lieu', 'sen_cam',
    'xy_lanh_cu', 'so_linh_kien_turbo',
]


def add_enum_values(apps, schema_editor):
    """Thêm tất cả giá trị mới vào ENUM product_loai."""
    for val in NEW_LOAI_VALUES:
        try:
            schema_editor.execute(
                f"ALTER TYPE product_loai ADD VALUE IF NOT EXISTS '{val}'"
            )
        except Exception:
            # Nếu giá trị đã tồn tại (IF NOT EXISTS có thể ko được hỗ trợ)
            pass


def remove_enum_values(apps, schema_editor):
    """PostgreSQL không hỗ trợ xóa giá trị khỏi ENUM, nên reverse là no-op."""
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('products', '0004_seed_categories'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_loai') THEN
                        CREATE TYPE product_loai AS ENUM ('turbo', 'ruot');
                    END IF;
                END$$;
                """
            ] + [
                f"ALTER TYPE product_loai ADD VALUE IF NOT EXISTS '{val}';"
                for val in NEW_LOAI_VALUES
            ],
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
