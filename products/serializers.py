from django.utils import timezone
from rest_framework import serializers
from . import models


class HangMaySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.HangMay
        fields = ['id', 'ten', 'slug']


class HangSxSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.HangSx
        fields = ['id', 'ten', 'slug']


class ThuongHieuSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ThuongHieu
        fields = ['id', 'ten', 'slug']


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = models.Category
        fields = ['id', 'ten', 'slug', 'mo_ta', 'order', 'product_count']

    def get_product_count(self, obj):
        return getattr(obj, 'product_count', obj.products.filter(is_active=True).count())


class NhaXeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.NhaXe
        fields = ['id', 'ten_nha_xe', 'dien_thoai', 'dia_chi', 'gio_nhan', 'ghi_chu']


class ProductListSerializer(serializers.ModelSerializer):
    hang_may_name = serializers.CharField(source='hang_may.ten', read_only=True)
    hang_sx_name = serializers.CharField(source='hang_sx.ten', read_only=True, default='')
    thuong_hieu_name = serializers.CharField(source='thuong_hieu.ten', read_only=True, default='')
    category_name = serializers.CharField(source='category.ten', read_only=True, default='')

    class Meta:
        model = models.Product
        fields = [
            'id', 'loai', 'ma_vt', 'ten_hang', 'model_turbo', 'ma_dong_co', 'oem_part_no',
            'dac_diem', 'ung_dung', 'ghi_chu', 'hinh_anh', 'danh_sach_hinh_anh',
            'dvt', 'doi_th_sx', 'parno',
            'hang_may', 'hang_may_name',
            'hang_sx', 'hang_sx_name',
            'thuong_hieu', 'thuong_hieu_name',
            'category', 'category_name',
            'gia_von', 'gia_vip', 'gia_uu_dai', 'gia_dai_ly', 'gia_gara', 'gia_dl_10',
            'cg_duoi', 'cg_dinh', 'cg_so',
            'cl_duoi', 'cl_dinh', 'cl_so',
            'attributes',
            'sheet_name', 'is_active', 'created_at',
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    hang_may = HangMaySerializer(read_only=True)
    hang_sx = HangSxSerializer(read_only=True)
    thuong_hieu = ThuongHieuSerializer(read_only=True)
    category = CategorySerializer(read_only=True)

    class Meta:
        model = models.Product
        fields = '__all__'


class CustomerSerializer(serializers.ModelSerializer):
    nha_xe_name = serializers.CharField(source='nha_xe.ten_nha_xe', read_only=True, default='')
    ma_kh = serializers.CharField(max_length=50, required=False, allow_blank=True)

    class Meta:
        model = models.Customer
        fields = [
            'id', 'ma_kh', 'ten_kh', 'dien_thoai', 'phan_loai',
            'dia_chi', 'tinh_tp', 'ghi_chu', 'nha_xe', 'nha_xe_name',
            'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'nha_xe_name', 'is_active', 'created_at']

    def validate_ten_kh(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Ten khach hang la bat buoc')
        return value

    def create(self, validated_data):
        if not validated_data.get('ma_kh'):
            validated_data['ma_kh'] = self._generate_customer_code()
        return super().create(validated_data)

    @staticmethod
    def _generate_customer_code():
        base = timezone.now().strftime('KH%y%m%d%H%M%S%f')[:48]
        code = base
        counter = 1
        while models.Customer.objects.filter(ma_kh=code).exists():
            code = f'{base}{counter}'[:50]
            counter += 1
        return code


class CustomerSearchSerializer(serializers.ModelSerializer):
    """Gọn nhẹ cho autocomplete"""
    class Meta:
        model = models.Customer
        fields = ['id', 'ma_kh', 'ten_kh', 'dien_thoai', 'phan_loai', 'dia_chi', 'tinh_tp']


class ImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ImportLog
        fields = '__all__'


class QuotationItemCustomSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    custom_price = serializers.DecimalField(max_digits=12, decimal_places=0)
    price_label = serializers.CharField(max_length=50)
    quantity = serializers.IntegerField(default=1, min_value=1)


class QuotationRequestSerializer(serializers.Serializer):
    product_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    customer_id = serializers.IntegerField()
    items_custom = QuotationItemCustomSerializer(many=True, required=False)

    def validate_product_ids(self, value):
        if len(value) > 200:
            raise serializers.ValidationError('Tối đa 200 sản phẩm mỗi lần báo giá')
        return value


class QuotationProductSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    ma_vt = serializers.CharField()
    ten_hang = serializers.CharField(required=False, default='')
    model_turbo = serializers.CharField(required=False, default='')
    ma_dong_co = serializers.CharField(required=False, default='')
    oem_part_no = serializers.CharField(required=False, default='')
    dac_diem = serializers.CharField(required=False, default='')
    ung_dung = serializers.CharField(required=False, default='')
    don_gia = serializers.DecimalField(max_digits=12, decimal_places=0)
    so_luong = serializers.IntegerField(default=1)
    thanh_tien = serializers.DecimalField(max_digits=12, decimal_places=0)


class QuotationResponseSerializer(serializers.Serializer):
    quote_number = serializers.CharField()
    quote_date = serializers.CharField()
    customer = CustomerSerializer()
    gia_ap_dung = serializers.CharField()
    products = QuotationProductSerializer(many=True)
    tong_cong = serializers.DecimalField(max_digits=14, decimal_places=0)
    tong_chu = serializers.CharField()
    company = serializers.DictField()


# ═══════════ Quotation History ═══════════

class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.QuotationItem
        fields = ['id', 'ma_vt', 'ten_hang', 'don_gia', 'so_luong', 'thanh_tien']


class QuotationListSerializer(serializers.ModelSerializer):
    """Danh sách báo giá (không include items để nhẹ)."""
    items = QuotationItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_excel_file = serializers.SerializerMethodField()

    class Meta:
        model = models.Quotation
        fields = [
            'id', 'quote_number', 'quote_date', 'customer_id',
            'customer_name', 'customer_phone', 'gia_ap_dung',
            'tong_cong', 'product_count', 'nhan_vien',
            'status', 'status_display', 'ghi_chu',
            'excel_file_name', 'excel_file_size', 'excel_created_at', 'has_excel_file',
            'created_at', 'updated_at', 'items',
        ]
        read_only_fields = ['id', 'quote_number', 'created_at', 'updated_at']

    def get_has_excel_file(self, obj):
        return bool(obj.excel_file_path)


class QuotationUpdateSerializer(serializers.ModelSerializer):
    """Cập nhật trạng thái + ghi chú báo giá."""

    class Meta:
        model = models.Quotation
        fields = ['status', 'ghi_chu', 'nhan_vien']


class QuotationItemUpdateSerializer(serializers.Serializer):
    """Nhận request cập nhật đơn giá 1 dòng trong báo giá."""
    ma_vt = serializers.CharField(max_length=100)
    don_gia = serializers.DecimalField(max_digits=12, decimal_places=0)

    def validate_don_gia(self, value):
        if value < 0:
            raise serializers.ValidationError('Don gia khong duoc am')
        return value


class QuotationUpdateItemsSerializer(serializers.Serializer):
    """Nhận request cập nhật nhiều dòng trong báo giá."""
    items = serializers.ListField(
        child=QuotationItemUpdateSerializer(),
        min_length=1,
        max_length=100,
    )

    def validate_items(self, value):
        if len(value) > 100:
            raise serializers.ValidationError('Toi da 100 dong moi lan cap nhat')
        return value


class QuotationSaveSerializer(serializers.Serializer):
    """Nhận request lưu báo giá đã gởi."""
    product_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    customer_id = serializers.IntegerField()
    nhan_vien = serializers.CharField(max_length=100, required=False, default='', allow_blank=True)
    items_custom = QuotationItemCustomSerializer(many=True, required=False)

    def validate_product_ids(self, value):
        if len(value) > 200:
            raise serializers.ValidationError('Tối đa 200 sản phẩm mỗi lần báo giá')
        return value
