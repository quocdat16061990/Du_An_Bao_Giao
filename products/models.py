from django.db import models


class HangMay(models.Model):
    """Hãng máy (Machine brand) — VD: CAT, CUMMINS, KOMATSU"""
    ten = models.CharField("Tên hãng máy", max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        db_table = 'hang_may'
        ordering = ['ten']

    def __str__(self):
        return self.ten


class HangSx(models.Model):
    """Hãng sản xuất — VD: Garrett, Mitsubishi, IZUMI"""
    ten = models.CharField("Tên hãng SX", max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        db_table = 'hang_sx'
        ordering = ['ten']

    def __str__(self):
        return self.ten


class ThuongHieu(models.Model):
    """Thương hiệu — VD: JRONE, TBS, VIDARIR, DF"""
    ten = models.CharField("Tên thương hiệu", max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        db_table = 'thuong_hieu'
        ordering = ['ten']

    def __str__(self):
        return self.ten


class Category(models.Model):
    """Danh mục sản phẩm — VD: Piston, Xy lanh, Turbo, Két nước..."""
    ten = models.CharField("Tên danh mục", max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    mo_ta = models.TextField("Mô tả", blank=True, default='')
    order = models.PositiveIntegerField("Thứ tự hiển thị", default=0)

    class Meta:
        db_table = 'categories'
        ordering = ['order', 'ten']
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.ten


class NhaXe(models.Model):
    """Nhà xe / Chành xe vận chuyển"""
    ten_nha_xe = models.CharField("Tên nhà xe", max_length=300)
    dien_thoai = models.CharField("Điện thoại", max_length=20, blank=True, default='')
    dia_chi = models.TextField("Địa chỉ", blank=True, default='')
    gio_nhan = models.CharField("Giờ nhận", max_length=100, blank=True, default='')
    ghi_chu = models.TextField("Ghi chú", blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'nha_xe'
        ordering = ['ten_nha_xe']

    def __str__(self):
        return self.ten_nha_xe


class Product(models.Model):
    """Sản phẩm — Tất cả phụ tùng động cơ diesel"""

    class Loai(models.TextChoices):
        TURBO = 'turbo', 'Turbo đầy đủ'
        RUOT = 'ruot', 'Ruột turbo'
        PISTON = 'piston', 'Piston'
        SEC_MANG = 'sec_mang', 'Séc măng'
        XY_LANH = 'xy_lanh', 'Xy lanh'
        BO_HOI = 'bo_hoi', 'Bộ hơi'
        RON_BO = 'ron_bo', 'Ron bộ'
        RON_MIENG = 'ron_mieng', 'Ron miếng'
        RON_CAT_TE = 'ron_cat_te', 'Ron cát te'
        MIENG_BAC = 'mieng_bac', 'Miếng bạc'
        CAN_THAU = 'can_thau', 'Căn thau'
        PHOT_DAU = 'phot_dau', 'Phốt đầu trục cơ'
        PHOT_DUOI = 'phot_duoi', 'Phốt đuôi trục cơ'
        THUN_CO = 'thun_co', 'Thun cò'
        THUN_XY_LANH = 'thun_xy_lanh', 'Thun xy lanh'
        SUPAP = 'supap', 'Supap'
        TRUC_CO = 'truc_co', 'Trục cơ'
        BOM_NUOC = 'bom_nuoc', 'Bơm nước'
        NAP_QUY_LAT = 'nap_quy_lat', 'Nắp quy lát'
        BOM_NHOT = 'bom_nhot', 'Bơm nhớt'
        TRUC_CAM = 'truc_cam', 'Trục cam'
        NAP_SINH_HAN = 'nap_sinh_han', 'Nắp sinh hàn'
        RUOT_SINH_HAN = 'ruot_sinh_han', 'Ruột sinh hàn'
        KET_NUOC = 'ket_nuoc', 'Két nước'
        NHIP_TAY_BIEN = 'nhip_tay_bien', 'Nhíp tay biên'
        SAM_BAC = 'sam_bac', 'Sam bạc'
        LOC_MAY = 'loc_may', 'Lọc máy'
        VAN_HANG_NHIET = 'van_hang_nhiet', 'Van hằng nhiệt'
        VANH_RANG_BANH_DA = 'vanh_rang_banh_da', 'Vành răng bánh đà'
        ONG_DAN_NHIEN_LIEU = 'ong_dan_nhien_lieu', 'Ống dẫn nhiên liệu'
        SEN_CAM = 'sen_cam', 'Sên cam'
        XY_LANH_CU = 'xy_lanh_cu', 'Xy lanh cũ'
        SO_LINH_KIEN_TURBO = 'so_linh_kien_turbo', 'Số & Linh kiện Turbo'

    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    hang_may = models.ForeignKey(HangMay, on_delete=models.CASCADE, related_name='products')
    hang_sx = models.ForeignKey(HangSx, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    thuong_hieu = models.ForeignKey(ThuongHieu, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    loai = models.CharField("Loại sản phẩm", max_length=30, choices=Loai.choices, default=Loai.TURBO)

    # Định danh chung
    ma_vt = models.CharField("Mã VT", max_length=100)
    ten_hang = models.CharField("Tên hàng", max_length=500, blank=True, default='')
    dvt = models.CharField("Đơn vị tính", max_length=50, blank=True, default='Cái')
    doi_th_sx = models.CharField("Đời/TH SX", max_length=100, blank=True, default='')
    parno = models.CharField("Part Number gốc", max_length=300, blank=True, default='')

    # Turbo-specific (giữ lại để backward compat)
    model_turbo = models.CharField("Model Turbo", max_length=300, blank=True, default='')
    ma_dong_co = models.CharField("Mã động cơ", max_length=300, blank=True, default='')
    oem_part_no = models.TextField("OEM Part No", blank=True, default='')
    dac_diem = models.TextField("Đặc điểm", blank=True, default='')
    ung_dung = models.TextField("Ứng dụng", blank=True, default='')

    # Chung
    hinh_anh = models.URLField("Hình ảnh", blank=True, default='', max_length=500)
    danh_sach_hinh_anh = models.JSONField("Danh sách hình ảnh", default=list, blank=True)
    ghi_chu = models.TextField("Ghi chú", blank=True, default='')

    # Giá (6 mức)
    gia_von = models.DecimalField("Giá vốn", max_digits=12, decimal_places=0, null=True, blank=True)
    gia_vip = models.DecimalField("Giá VIP", max_digits=12, decimal_places=0, null=True, blank=True)
    gia_uu_dai = models.DecimalField("Giá ưu đãi", max_digits=12, decimal_places=0, null=True, blank=True)
    gia_dai_ly = models.DecimalField("Giá đại lý", max_digits=12, decimal_places=0, null=True, blank=True)
    gia_gara = models.DecimalField("Giá gara", max_digits=12, decimal_places=0, null=True, blank=True)
    gia_dl_10 = models.DecimalField("Giá ĐL+10%", max_digits=12, decimal_places=0, null=True, blank=True)

    # Kỹ thuật: CG = Cánh Gạt, CL = Cánh Lớn (turbo-specific, giữ lại)
    cg_duoi = models.DecimalField("CG Ø Dưới", max_digits=8, decimal_places=2, null=True, blank=True)
    cg_dinh = models.DecimalField("CG Ø Đỉnh", max_digits=8, decimal_places=2, null=True, blank=True)
    cg_so = models.CharField("CG Số", max_length=20, blank=True, default='')
    cl_duoi = models.DecimalField("CL Ø Dưới", max_digits=8, decimal_places=2, null=True, blank=True)
    cl_dinh = models.DecimalField("CL Ø Đỉnh", max_digits=8, decimal_places=2, null=True, blank=True)
    cl_so = models.CharField("CL Số", max_length=20, blank=True, default='')

    # Thuộc tính đặc thù theo danh mục (JSON linh hoạt)
    attributes = models.JSONField("Thuộc tính đặc thù", default=dict, blank=True)

    # Metadata
    sheet_name = models.CharField("Sheet gốc", max_length=50, blank=True, default='')
    is_active = models.BooleanField("Đang hiển thị", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['ma_vt']
        indexes = [
            models.Index(fields=['ma_vt']),
            models.Index(fields=['model_turbo']),
            models.Index(fields=['loai']),
            models.Index(fields=['category']),
            models.Index(fields=['hang_may']),
            models.Index(fields=['thuong_hieu']),
            models.Index(fields=['is_active']),
            models.Index(fields=['ten_hang']),
        ]

    def __str__(self):
        label = self.ten_hang or self.model_turbo or '?'
        return f"[{self.ma_vt}] {label}"[:80]

    def display_name(self) -> str:
        """Tên hiển thị ưu tiên: ten_hang > model_turbo > ma_vt"""
        return self.ten_hang or self.model_turbo or self.ma_vt

    def save(self, *args, **kwargs):
        if not isinstance(self.danh_sach_hinh_anh, list):
            self.danh_sach_hinh_anh = []

        # Đồng bộ ảnh chính vào danh sách ảnh
        if self.hinh_anh and self.hinh_anh not in self.danh_sach_hinh_anh:
            self.danh_sach_hinh_anh.insert(0, self.hinh_anh)
        # Nếu chưa có ảnh chính nhưng có danh sách ảnh, lấy ảnh đầu tiên làm ảnh chính
        elif not self.hinh_anh and self.danh_sach_hinh_anh:
            self.hinh_anh = self.danh_sach_hinh_anh[0]

        super().save(*args, **kwargs)

    def get_price_for_type(self, phan_loai: str):
        """Lấy giá theo phân loại khách hàng."""
        from decimal import Decimal
        mapping = {
            'VIP': self.gia_vip,
            'ƯU_ĐÃI': self.gia_uu_dai,
            'ĐẠI_LÝ': self.gia_dai_ly,
            'NGOẠI_LỆ': self.gia_dl_10,
        }
        price = mapping.get(phan_loai.upper())
        if price is not None:
            return price
        return self.gia_dl_10 or self.gia_vip or self.gia_uu_dai or self.gia_dai_ly or Decimal('0')

    def is_turbo(self) -> bool:
        """Kiểm tra sản phẩm có phải turbo không."""
        return self.loai in ('turbo', 'ruot', 'so_linh_kien_turbo')


class Customer(models.Model):
    """Khách hàng"""

    class PhanLoai(models.TextChoices):
        VIP = 'VIP', 'Khách VIP'
        UU_DAI = 'ƯU_ĐÃI', 'Khách ưu đãi'
        NGOAI_LE = 'NGOẠI_LỆ', 'VIP ngoại lệ'
        CHUA_PL = 'CHƯA_PL', 'Chưa phân loại'

    ma_kh = models.CharField("Mã KH", max_length=50, unique=True)
    ten_kh = models.CharField("Tên khách hàng", max_length=300)
    dien_thoai = models.CharField("Điện thoại", max_length=20, blank=True, default='')
    phan_loai = models.CharField("Phân loại", max_length=20, choices=PhanLoai.choices, default=PhanLoai.CHUA_PL)
    dia_chi = models.TextField("Địa chỉ", blank=True, default='')
    tinh_tp = models.CharField("Tỉnh/TP", max_length=100, blank=True, default='')
    ghi_chu = models.TextField("Ghi chú", blank=True, default='')
    nha_xe = models.ForeignKey(NhaXe, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers')
    is_active = models.BooleanField("Đang hoạt động", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['ten_kh']
        indexes = [
            models.Index(fields=['ten_kh']),
            models.Index(fields=['dien_thoai']),
            models.Index(fields=['phan_loai']),
        ]

    def __str__(self):
        return f"{self.ten_kh} ({self.dien_thoai or self.ma_kh})"


class Quotation(models.Model):
    """Báo giá đã gởi cho khách hàng"""

    class Status(models.TextChoices):
        DA_GUI = 'DA_GUI', 'Đã gởi'
        DA_CHOT = 'DA_CHOT', 'Đã chốt'
        THUA = 'THUA', 'Thua'

    quote_number = models.CharField("Số báo giá", max_length=50, unique=True)
    quote_date = models.DateField("Ngày báo giá", auto_now_add=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='quotations')
    customer_name = models.CharField("Tên KH (snapshot)", max_length=300)
    customer_phone = models.CharField("ĐT KH (snapshot)", max_length=20, blank=True, default='')
    gia_ap_dung = models.CharField("Loại giá áp dụng", max_length=50)
    tong_cong = models.DecimalField("Tổng cộng", max_digits=14, decimal_places=0)
    product_count = models.PositiveIntegerField("Số lượng SP", default=0)
    nhan_vien = models.CharField("Nhân viên báo giá", max_length=100, blank=True, default='')
    status = models.CharField("Trạng thái", max_length=20, choices=Status.choices, default=Status.DA_GUI)
    ghi_chu = models.TextField("Ghi chú", blank=True, default='')
    excel_file_name = models.CharField("Ten file Excel", max_length=255, blank=True, default='')
    excel_file_path = models.CharField("Duong dan file Excel", max_length=500, blank=True, default='')
    excel_file_size = models.PositiveIntegerField("Dung luong file Excel", default=0)
    excel_created_at = models.DateTimeField("Thoi diem tao file Excel", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quotations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['quote_date']),
            models.Index(fields=['customer']),
            models.Index(fields=['created_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.quote_number} — {self.customer_name}"


class QuotationItem(models.Model):
    """Chi tiết từng dòng sản phẩm trong báo giá"""
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotation_items')
    ma_vt = models.CharField("Mã VT", max_length=100)
    ten_hang = models.CharField("Tên hàng", max_length=500, blank=True, default='')
    don_gia = models.DecimalField("Đơn giá", max_digits=12, decimal_places=0)
    so_luong = models.PositiveIntegerField("Số lượng", default=1)
    thanh_tien = models.DecimalField("Thành tiền", max_digits=12, decimal_places=0)

    class Meta:
        db_table = 'quotation_items'
        ordering = ['id']

    def __str__(self):
        return f"{self.ma_vt} — {self.don_gia:,}đ"


class ImportLog(models.Model):
    """Ghi log mỗi lần import Excel"""
    file_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=[
        ('SUCCESS', 'Thành công'),
        ('PARTIAL', 'Một phần'),
        ('FAILED', 'Thất bại'),
    ])
    products_created = models.PositiveIntegerField(default=0)
    products_updated = models.PositiveIntegerField(default=0)
    customers_created = models.PositiveIntegerField(default=0)
    customers_updated = models.PositiveIntegerField(default=0)
    errors = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'import_logs'
        ordering = ['-created_at']
