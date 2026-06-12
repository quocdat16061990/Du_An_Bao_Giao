"""Seed 33+ danh mục sản phẩm từ dữ liệu thực tế."""
from django.db import migrations

CATEGORIES = [
    # Turbo group
    ('Turbo', 'turbo', 'Turbo tăng áp đầy đủ', 1),
    ('Ruột Turbo', 'ruot-turbo', 'Ruột turbo (CHRA)', 2),
    ('Số & Linh Kiện Turbo', 'so-linh-kien-turbo', 'Cổ hơi, nozzle, linh kiện turbo', 3),
    # Bộ hơi group
    ('Piston', 'piston', 'Piston động cơ', 10),
    ('Séc măng', 'sec-mang', 'Séc măng / Bạc piston', 11),
    ('Xy lanh', 'xy-lanh', 'Xy lanh / Lót xy lanh', 12),
    ('Bộ hơi', 'bo-hoi', 'Bộ hơi (Piston + Séc măng + Xy lanh)', 13),
    ('Xy lanh cũ', 'xy-lanh-cu', 'Xy lanh đã qua sử dụng', 14),
    # Ron & Gioăng group
    ('Ron bộ', 'ron-bo', 'Ron bộ / Gasket set đầy đủ', 20),
    ('Ron miếng', 'ron-mieng', 'Ron miếng / Ron mặt máy', 21),
    ('Ron cát te', 'ron-cat-te', 'Ron cát te / Ron đáy máy', 22),
    ('Thun cò', 'thun-co', 'Thun/ron nắp cò', 23),
    ('Thun xy lanh', 'thun-xy-lanh', 'Thun/ron xy lanh', 24),
    # Bạc & Căn group
    ('Miếng bạc', 'mieng-bac', 'Miếng bạc / Bạc đỡ trục', 30),
    ('Căn thau', 'can-thau', 'Căn thau / Thrust washer', 31),
    ('Sam bạc', 'sam-bac', 'Sam bạc / Bạc tay biên', 32),
    ('Nhíp tay biên', 'nhip-tay-bien', 'Nhíp tay biên / Bushing', 33),
    # Phốt group
    ('Phốt đầu trục cơ', 'phot-dau-truc-co', 'Phốt đầu trục cơ / Front seal', 40),
    ('Phốt đuôi trục cơ', 'phot-duoi-truc-co', 'Phốt đuôi trục cơ / Rear seal', 41),
    # Supap & Trục group
    ('Supap', 'supap', 'Supap hút / Supap xả', 50),
    ('Trục cơ', 'truc-co', 'Trục cơ / Crankshaft', 51),
    ('Trục cam', 'truc-cam', 'Trục cam / Camshaft', 52),
    ('Sên cam', 'sen-cam', 'Sên cam / Timing chain', 53),
    # Bơm group
    ('Bơm nước', 'bom-nuoc', 'Bơm nước / Water pump', 60),
    ('Bơm nhớt', 'bom-nhot', 'Bơm nhớt / Oil pump', 61),
    # Nắp & Két group
    ('Nắp quy lát', 'nap-quy-lat', 'Nắp quy lát / Cylinder head', 70),
    ('Nắp sinh hàn', 'nap-sinh-han', 'Nắp sinh hàn / Radiator cap', 71),
    ('Ruột sinh hàn', 'ruot-sinh-han', 'Ruột sinh hàn / Radiator core', 72),
    ('Két nước', 'ket-nuoc', 'Két nước / Radiator', 73),
    # Khác
    ('Lọc máy', 'loc-may', 'Lọc máy / Lọc nhớt động cơ', 80),
    ('Van hằng nhiệt', 'van-hang-nhiet', 'Van hằng nhiệt / Thermostat', 81),
    ('Vành răng bánh đà', 'vanh-rang-banh-da', 'Vành răng bánh đà / Ring gear', 82),
    ('Ống dẫn nhiên liệu', 'ong-dan-nhien-lieu', 'Ống dẫn nhiên liệu / Fuel line', 83),
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model('products', 'Category')
    for ten, slug, mo_ta, order in CATEGORIES:
        Category.objects.get_or_create(
            slug=slug,
            defaults={'ten': ten, 'mo_ta': mo_ta, 'order': order},
        )


def unseed_categories(apps, schema_editor):
    Category = apps.get_model('products', 'Category')
    slugs = [s for _, s, _, _ in CATEGORIES]
    # Chỉ xóa category chưa có sản phẩm nào
    Category.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('products', '0003_map_categories_data'),
    ]

    operations = [
        migrations.RunPython(seed_categories, unseed_categories),
    ]
