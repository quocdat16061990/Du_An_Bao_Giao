"""Migration 0002: Thêm Category model + mở rộng Product fields."""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        # ── Category model ──
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ten', models.CharField(max_length=100, unique=True, verbose_name='Tên danh mục')),
                ('slug', models.SlugField(max_length=100, unique=True)),
                ('mo_ta', models.TextField(blank=True, default='', verbose_name='Mô tả')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Thứ tự hiển thị')),
            ],
            options={
                'verbose_name_plural': 'categories',
                'db_table': 'categories',
                'ordering': ['order', 'ten'],
            },
        ),

        # ── Thêm field mới vào Product (additive only) ──
        migrations.AddField(
            model_name='product',
            name='attributes',
            field=models.JSONField(blank=True, default=dict, verbose_name='Thuộc tính đặc thù'),
        ),
        migrations.AddField(
            model_name='product',
            name='doi_th_sx',
            field=models.CharField(blank=True, default='', max_length=100, verbose_name='Đời/TH SX'),
        ),
        migrations.AddField(
            model_name='product',
            name='dvt',
            field=models.CharField(blank=True, default='Cái', max_length=50, verbose_name='Đơn vị tính'),
        ),
        migrations.AddField(
            model_name='product',
            name='gia_gara',
            field=models.DecimalField(blank=True, decimal_places=0, max_digits=12, null=True, verbose_name='Giá gara'),
        ),
        migrations.AddField(
            model_name='product',
            name='gia_von',
            field=models.DecimalField(blank=True, decimal_places=0, max_digits=12, null=True, verbose_name='Giá vốn'),
        ),
        migrations.AddField(
            model_name='product',
            name='parno',
            field=models.CharField(blank=True, default='', max_length=300, verbose_name='Part Number gốc'),
        ),
        migrations.AddField(
            model_name='product',
            name='ten_hang',
            field=models.CharField(blank=True, default='', max_length=500, verbose_name='Tên hàng'),
        ),

        # ── Mở rộng loai choices + max_length (chỉ state, không ALTER DB vì view v_products_full) ──
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='product',
                    name='loai',
                    field=models.CharField(
                        choices=[
                            ('turbo', 'Turbo đầy đủ'), ('ruot', 'Ruột turbo'),
                            ('piston', 'Piston'), ('sec_mang', 'Séc măng'),
                            ('xy_lanh', 'Xy lanh'), ('bo_hoi', 'Bộ hơi'),
                            ('ron_bo', 'Ron bộ'), ('ron_mieng', 'Ron miếng'),
                            ('ron_cat_te', 'Ron cát te'), ('mieng_bac', 'Miếng bạc'),
                            ('can_thau', 'Căn thau'), ('phot_dau', 'Phốt đầu trục cơ'),
                            ('phot_duoi', 'Phốt đuôi trục cơ'), ('thun_co', 'Thun cò'),
                            ('thun_xy_lanh', 'Thun xy lanh'), ('supap', 'Supap'),
                            ('truc_co', 'Trục cơ'), ('bom_nuoc', 'Bơm nước'),
                            ('nap_quy_lat', 'Nắp quy lát'), ('bom_nhot', 'Bơm nhớt'),
                            ('truc_cam', 'Trục cam'), ('nap_sinh_han', 'Nắp sinh hàn'),
                            ('ruot_sinh_han', 'Ruột sinh hàn'), ('ket_nuoc', 'Két nước'),
                            ('nhip_tay_bien', 'Nhíp tay biên'), ('sam_bac', 'Sam bạc'),
                            ('loc_may', 'Lọc máy'), ('van_hang_nhiet', 'Van hằng nhiệt'),
                            ('vanh_rang_banh_da', 'Vành răng bánh đà'),
                            ('ong_dan_nhien_lieu', 'Ống dẫn nhiên liệu'),
                            ('sen_cam', 'Sên cam'), ('xy_lanh_cu', 'Xy lanh cũ'),
                            ('so_linh_kien_turbo', 'Số & Linh kiện Turbo'),
                        ],
                        default='turbo', max_length=30, verbose_name='Loại sản phẩm'
                    ),
                ),
            ],
            database_operations=[],
        ),

        # ── Category FK ──
        migrations.AddField(
            model_name='product',
            name='category',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='products', to='products.category'),
        ),

        # ── Indexes ──
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['category'], name='products_categor_4083ff_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['ten_hang'], name='products_ten_han_5d78a8_idx'),
        ),
    ]
