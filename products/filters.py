import re
import django_filters
from django.db.models import Q, DecimalField
from django.db.models.functions import Coalesce
from .models import Product


class ProductFilter(django_filters.FilterSet):
    q = django_filters.CharFilter(method='filter_search', label='Search')
    hang_may = django_filters.NumberFilter(field_name='hang_may_id')
    hang_sx = django_filters.NumberFilter(field_name='hang_sx_id')
    thuong_hieu = django_filters.NumberFilter(field_name='thuong_hieu_id')
    loai = django_filters.ChoiceFilter(choices=Product.Loai.choices)
    category = django_filters.NumberFilter(field_name='category_id')
    category_slug = django_filters.CharFilter(field_name='category__slug', lookup_expr='exact')
    min_price = django_filters.NumberFilter(method='filter_min_price')
    max_price = django_filters.NumberFilter(method='filter_max_price')
    phan_loai_gia = django_filters.CharFilter(method='filter_phan_loai_gia')
    sheet = django_filters.CharFilter(field_name='sheet_name', lookup_expr='icontains')

    class Meta:
        model = Product
        fields = ['q', 'loai', 'category', 'hang_may', 'thuong_hieu', 'sheet']

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset

        # Tách từ khóa tìm kiếm cách nhau bởi khoảng trắng hoặc dấu phẩy
        tokens = [t.strip() for t in re.split(r'[, \s]+', value) if t.strip()]
        if not tokens:
            return queryset

        for token in tokens:
            queryset = queryset.filter(
                Q(ma_vt__icontains=token) |
                Q(ten_hang__icontains=token) |
                Q(model_turbo__icontains=token) |
                Q(ma_dong_co__icontains=token) |
                Q(oem_part_no__icontains=token) |
                Q(dac_diem__icontains=token) |
                Q(ung_dung__icontains=token) |
                Q(parno__icontains=token) |
                Q(category__ten__icontains=token) |
                Q(hang_may__ten__icontains=token) |
                Q(hang_sx__ten__icontains=token) |
                Q(thuong_hieu__ten__icontains=token)
            )
        return queryset

    def filter_min_price(self, queryset, name, value):
        if value is None:
            return queryset
        # Lấy giá thấp nhất trong 4 cột, so sánh >= min_price
        return queryset.annotate(
            _min_price=Coalesce('gia_vip', 'gia_uu_dai', 'gia_dai_ly', 'gia_dl_10', output_field=DecimalField())
        ).filter(_min_price__gte=value)

    def filter_max_price(self, queryset, name, value):
        if value is None:
            return queryset
        return queryset.annotate(
            _min_price=Coalesce('gia_vip', 'gia_uu_dai', 'gia_dai_ly', 'gia_dl_10', output_field=DecimalField())
        ).filter(_min_price__lte=value)

    def filter_phan_loai_gia(self, queryset, name, value):
        """Lọc sản phẩm có giá theo loại (VIP, ƯU ĐÃI, ĐẠI LÝ, GARA, VỐN, ĐL+10)"""
        col_map = {
            'vip': 'gia_vip',
            'uu_dai': 'gia_uu_dai',
            'dai_ly': 'gia_dai_ly',
            'gara': 'gia_gara',
            'von': 'gia_von',
            'dl_10': 'gia_dl_10',
        }
        col = col_map.get(value.lower())
        if col:
            return queryset.filter(**{f'{col}__isnull': False})
        return queryset
