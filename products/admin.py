from django.contrib import admin
from . import models


@admin.register(models.HangMay)
class HangMayAdmin(admin.ModelAdmin):
    list_display = ['ten', 'slug']
    search_fields = ['ten']


@admin.register(models.HangSx)
class HangSxAdmin(admin.ModelAdmin):
    list_display = ['ten', 'slug']
    search_fields = ['ten']


@admin.register(models.ThuongHieu)
class ThuongHieuAdmin(admin.ModelAdmin):
    list_display = ['ten', 'slug']
    search_fields = ['ten']


@admin.register(models.NhaXe)
class NhaXeAdmin(admin.ModelAdmin):
    list_display = ['ten_nha_xe', 'dien_thoai', 'gio_nhan']
    search_fields = ['ten_nha_xe']


@admin.register(models.Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['ten', 'slug', 'order']
    search_fields = ['ten', 'slug']
    list_editable = ['order']


@admin.register(models.Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['ma_vt', 'ten_hang', 'category', 'hang_may', 'thuong_hieu', 'loai', 'gia_vip', 'is_active']
    list_filter = ['loai', 'category', 'hang_may', 'thuong_hieu', 'is_active']
    search_fields = ['ma_vt', 'ten_hang', 'model_turbo', 'ma_dong_co', 'oem_part_no']
    list_editable = ['is_active']


@admin.register(models.Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['ten_kh', 'dien_thoai', 'phan_loai', 'tinh_tp', 'is_active']
    list_filter = ['phan_loai', 'tinh_tp', 'is_active']
    search_fields = ['ten_kh', 'dien_thoai', 'ma_kh']


@admin.register(models.ImportLog)
class ImportLogAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'status', 'products_created', 'customers_created', 'created_at']
    list_filter = ['status']
