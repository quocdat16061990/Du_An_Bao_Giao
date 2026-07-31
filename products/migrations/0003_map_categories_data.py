"""Data migration: Map Product.loai → Product.category FK."""
from django.db import migrations


def map_loai_to_category(apps, schema_editor):
    """Tạo Category 'Turbo' và 'Ruột Turbo' rồi gán cho Product hiện có."""
    Category = apps.get_model('products', 'Category')
    Product = apps.get_model('products', 'Product')

    # Tạo category Turbo
    turbo_cat, _ = Category.objects.get_or_create(
        slug='turbo',
        defaults={'ten': 'Turbo', 'mo_ta': 'Turbo tăng áp đầy đủ', 'order': 1},
    )
    # Tạo category Ruột Turbo
    ruot_cat, _ = Category.objects.get_or_create(
        slug='ruot-turbo',
        defaults={'ten': 'Ruột Turbo', 'mo_ta': 'Ruột turbo (CHRA)', 'order': 2},
    )

    # Map loai -> category
    Product.objects.filter(loai='turbo').update(category=turbo_cat)
    Product.objects.filter(loai='ruot').update(category=ruot_cat)


def reverse_map(apps, schema_editor):
    """Đưa category về NULL cho tất cả Product."""
    Product = apps.get_model('products', 'Product')
    Product.objects.all().update(category=None)


class Migration(migrations.Migration):
    dependencies = [
        ('products', '0002_add_category_expand_product'),
    ]

    operations = [
        migrations.RunPython(map_loai_to_category, reverse_map),
    ]
