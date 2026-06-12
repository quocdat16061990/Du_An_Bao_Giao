# PlanBE.md — Giải Pháp Backend Django cho TURBO DIESEL

> **Trạng thái**: CHỜ DUYỆT
> **Ngày**: 2026-06-10
> **Stack**: Django 5.x + Django REST Framework + PostgreSQL (production) / SQLite (dev)

---

## I. Giải Pháp Tổng Quan

### 1.1 Bài Toán

Backend cần giải quyết 4 bài toán chính:

| # | Bài toán | Độ khó | Giải pháp |
|---|----------|--------|-----------|
| 1 | Import dữ liệu từ Excel BÁO GIÁ TURBO | Trung bình | Management command dùng `openpyxl` |
| 2 | Search full-text + filter sản phẩm | Trung bình | PostgreSQL `SearchRank` + `TrigramSimilarity` (production) / `icontains` (dev SQLite) |
| 3 | Autocomplete search khách hàng | Dễ | `TrigramSimilarity` hoặc `icontains` |
| 4 | Sinh HTML báo giá từ selected SP + KH | Dễ | Django Template rendering + trả về JSON |

### 1.2 Quyết Định Kiến Trúc

| Quyết định | Lựa chọn | Lý do |
|------------|----------|-------|
| Database dev | **SQLite** | Không cần cài đặt, dev nhanh, đủ dùng cho dữ liệu < 10K sản phẩm |
| Database production | **PostgreSQL** | Full-text search (`pg_trgm`) mạnh hơn SQLite |
| Search engine | **PostgreSQL built-in** (không Elasticsearch) | Dữ liệu ~vài nghìn SP, PostgreSQL đủ mạnh, đỡ phải maintain thêm service |
| Excel parsing | **openpyxl** | Đọc trực tiếp .xlsx, hỗ trợ style, formula |
| File upload | **Optional** (command line import chính) | Đơn giản, dùng cho admin. Có thể thêm REST upload sau |
| API pagination | **PageNumberPagination** (default DRF) | Đơn giản, frontend quen thuộc |
| CORS | **django-cors-headers** | Cho phép frontend Vite dev server (localhost:5173) |

---

## II. Cấu Trúc Django Project

```
backend/
├── manage.py
├── requirements.txt
├── .env.example
│
├── backend/                              # Django project
│   ├── __init__.py
│   ├── settings.py                       # Split settings cho dev/prod
│   ├── urls.py                           # Main URL router → /api/v1/
│   ├── wsgi.py
│   └── asgi.py
│
├── products/                             # App: sản phẩm + khách hàng
│   ├── __init__.py
│   ├── models.py                         # Product, Customer, ImportLog
│   ├── serializers.py                    # DRF Serializers
│   ├── views.py                          # ProductViewSet, CustomerViewSet
│   ├── filters.py                        # ProductFilter, CustomerFilter
│   ├── urls.py
│   ├── admin.py                          # Django Admin tùy chỉnh
│   ├── services/
│   │   ├── __init__.py
│   │   ├── excel_importer.py             # Logic import Excel
│   │   └── quotation_generator.py        # Logic sinh báo giá HTML
│   ├── management/
│   │   └── commands/
│   │       ├── import_excel.py           # python manage.py import_excel [file]
│   │       └── seed_data.py              # python manage.py seed_data
│   └── migrations/
│
├── templates/                            # Django templates cho báo giá
│   └── quotation/
│       └── base.html                     # Template báo giá HTML
│
└── media/                                # Upload Excel files (optional)
    └── imports/
```

---

## III. Models — Thiết Kế Chi Tiết

### 3.1 Product Model

```python
class Product(models.Model):
    """Sản phẩm turbo — import từ Excel."""

    # ── Định danh ──
    ma_vt = models.CharField("Mã vật tư", max_length=100, db_index=True)
    ten_sp = models.CharField("Tên sản phẩm", max_length=500, blank=True)

    # ── Thông số kỹ thuật ──
    model_turbo = models.CharField("Model Turbo", max_length=300, blank=True)
    ma_dong_co = models.CharField("Mã động cơ", max_length=300, blank=True)
    oem_part_no = models.TextField("OEM Part Number", blank=True)
    dac_diem = models.TextField("Đặc điểm", blank=True)
    ung_dung = models.TextField("Ứng dụng", blank=True)
    hinh_anh = models.URLField("Hình ảnh", blank=True, max_length=500)

    # ── Giá ──
    gia_chung = models.DecimalField("Giá chung", max_digits=12, decimal_places=0,
                                     null=True, blank=True)
    gia_vip = models.DecimalField("Giá VIP", max_digits=12, decimal_places=0,
                                   null=True, blank=True)
    gia_uu_dai = models.DecimalField("Giá ưu đãi", max_digits=12, decimal_places=0,
                                      null=True, blank=True)
    gia_dai_ly = models.DecimalField("Giá đại lý", max_digits=12, decimal_places=0,
                                      null=True, blank=True)
    gia_dl_10 = models.DecimalField("Giá ĐL+10%", max_digits=12, decimal_places=0,
                                     null=True, blank=True)

    # ── Metadata ──
    sheet_name = models.CharField("Sheet gốc", max_length=100, blank=True)
    sheet_row = models.PositiveIntegerField("Dòng trong sheet", default=0)
    is_active = models.BooleanField("Đang hiển thị", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        ordering = ["ma_vt"]
        indexes = [
            models.Index(fields=["ma_vt"]),
            models.Index(fields=["model_turbo"]),
            models.Index(fields=["oem_part_no"]),  # Chỉ index trên 1 phần text
            models.Index(fields=["sheet_name"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"[{self.ma_vt}] {self.model_turbo or self.ten_sp or ''}"[:80]

    def get_price_for_type(self, phan_loai: str) -> Decimal | None:
        """Lấy giá theo phân loại khách hàng."""
        mapping = {
            'VIP': self.gia_vip,
            'ƯU_ĐÃI': self.gia_uu_dai,
            'ĐẠI_LÝ': self.gia_dai_ly,
        }
        return mapping.get(phan_loai.upper(), self.gia_dl_10) or self.gia_chung
```

### 3.2 Customer Model

```python
class Customer(models.Model):
    """Khách hàng — import từ sheet DANH SÁCH KH."""

    ma_kh = models.CharField("Mã KH", max_length=50, db_index=True, blank=True)
    ten_kh = models.CharField("Tên khách hàng", max_length=300, db_index=True)
    dien_thoai = models.CharField("Số điện thoại", max_length=20, blank=True, db_index=True)
    dia_chi = models.TextField("Địa chỉ", blank=True)
    tinh_tp = models.CharField("Tỉnh/TP", max_length=100, blank=True)

    # ── Phân loại ──
    class PhanLoaiChoices(models.TextChoices):
        VIP = 'VIP', 'VIP'
        UU_DAI = 'ƯU_ĐÃI', 'Ưu đãi'
        DAI_LY = 'ĐẠI_LÝ', 'Đại lý'
        KHAC = 'KHÁC', 'Khác'

    phan_loai = models.CharField(
        "Phân loại", max_length=20,
        choices=PhanLoaiChoices.choices,
        default=PhanLoaiChoices.KHAC,
    )

    ghi_chu = models.TextField("Ghi chú", blank=True)
    nha_xe = models.CharField("Nhà xe", max_length=300, blank=True)

    # ── Metadata ──
    is_active = models.BooleanField("Đang hoạt động", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customers"
        ordering = ["ten_kh"]
        indexes = [
            models.Index(fields=["ten_kh"]),
            models.Index(fields=["dien_thoai"]),
            models.Index(fields=["phan_loai"]),
        ]

    def __str__(self):
        return f"{self.ten_kh} ({self.ma_kh or self.dien_thoai or '?'})"
```

### 3.3 ImportLog Model

```python
class ImportLog(models.Model):
    """Ghi log mỗi lần import Excel."""

    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField("Dung lượng (bytes)", default=0)
    status = models.CharField(max_length=20, choices=[
        ('SUCCESS', 'Thành công'),
        ('PARTIAL', 'Một phần'),
        ('FAILED', 'Thất bại'),
    ])
    products_created = models.PositiveIntegerField(default=0)
    products_updated = models.PositiveIntegerField(default=0)
    customers_created = models.PositiveIntegerField(default=0)
    customers_updated = models.PositiveIntegerField(default=0)
    errors = models.JSONField("Danh sách lỗi", default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "import_logs"
        ordering = ["-created_at"]
```

---

## IV. Search Strategy — Giải Pháp Chi Tiết

### 4.1 Vấn Đề

Script gốc search bằng JavaScript: duyệt từng dòng, kiểm tra `cell.toLowerCase().includes(keyword)`. Cách này không scale được khi dữ liệu lớn và phải làm trên backend.

### 4.2 Giải Pháp cho SQLite (Development)

SQLite không hỗ trợ full-text search phức tạp, nên dùng **nhiều `icontains` OR**:

```python
from django.db.models import Q

def search_products(queryset, keyword: str):
    """Search sản phẩm với SQLite — icontains trên nhiều trường."""
    if not keyword:
        return queryset

    q = keyword.strip()
    return queryset.filter(
        Q(ma_vt__icontains=q) |
        Q(ten_sp__icontains=q) |
        Q(model_turbo__icontains=q) |
        Q(ma_dong_co__icontains=q) |
        Q(oem_part_no__icontains=q) |
        Q(dac_diem__icontains=q) |
        Q(ung_dung__icontains=q)
    )
```

- **Ưu điểm**: Đơn giản, không cần config
- **Nhược điểm**: Chậm khi > 50K dòng, không có ranking
- **Phù hợp**: Dev + dữ liệu < 10K SP

### 4.3 Giải Pháp cho PostgreSQL (Production)

Dùng `pg_trgm` extension với `TrigramSimilarity` cho ranking:

```python
# Kích hoạt: CREATE EXTENSION IF NOT EXISTS pg_trgm;

from django.contrib.postgres.search import TrigramSimilarity

def search_products_postgres(queryset, keyword: str):
    """Search với PostgreSQL — TrigramSimilarity ranking."""
    if not keyword:
        return queryset

    q = keyword.strip()

    return (
        queryset
        .annotate(
            similarity=(
                TrigramSimilarity('ma_vt', q) * 1.5 +          # Weight cao nhất
                TrigramSimilarity('model_turbo', q) * 1.2 +
                TrigramSimilarity('oem_part_no', q) * 1.2 +
                TrigramSimilarity('ma_dong_co', q) * 1.0 +
                TrigramSimilarity('ten_sp', q) * 0.8 +
                TrigramSimilarity('dac_diem', q) * 0.5 +
                TrigramSimilarity('ung_dung', q) * 0.3
            )
        )
        .filter(similarity__gt=0.05)  # Ngưỡng tối thiểu
        .order_by('-similarity')
    )
```

- **Weight**: Mã VT > Model/OEM > Động cơ > Tên SP > Đặc điểm > Ứng dụng
- **Ngưỡng 0.05**: Lọc bỏ kết quả quá không liên quan

### 4.4 Chiến Lược Dùng Cả 2

```python
# settings.py
USE_POSTGRES_SEARCH = os.getenv('USE_POSTGRES_SEARCH', 'False').lower() == 'true'

# filters.py
def filter_search(queryset, keyword):
    if USE_POSTGRES_SEARCH:
        return search_products_postgres(queryset, keyword)
    return search_products_sqlite(queryset, keyword)
```

---

## V. API Design — OpenAPI Style

### 5.1 Products API

```
GET /api/v1/products/
```

**Response 200:**
```json
{
  "count": 1234,
  "next": "http://localhost:8000/api/v1/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "ma_vt": "TURBO-001",
      "ten_sp": "Turbocharger GT35",
      "model_turbo": "GT3582R",
      "ma_dong_co": "4D56",
      "oem_part_no": "49135-03130 / 49135-03110",
      "dac_diem": "Bạc dầu, cánh 11",
      "ung_dung": "Mitsubishi Triton 2.5L",
      "hinh_anh": "",
      "gia_chung": 8500000,
      "gia_vip": 7500000,
      "gia_uu_dai": 7800000,
      "gia_dai_ly": 8000000,
      "gia_dl_10": 8800000,
      "sheet_name": "BÁO GIÁ",
      "is_active": true,
      "created_at": "2026-06-10T00:00:00Z"
    }
  ]
}
```

**Query Params:**
| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `q` | string | — | Search keyword |
| `phan_loai_gia` | string | — | `vip` / `uu_dai` / `dai_ly` / `dl_10` — Lọc SP có giá loại đó > 0 |
| `min_price` | number | — | Lọc SP có giá (theo loại đã chọn hoặc giá chung) >= X |
| `max_price` | number | — | Lọc SP có giá <= X |
| `sheet` | string | — | Lọc theo sheet gốc |
| `ordering` | string | `ma_vt` | `price` / `-price` / `ma_vt` / `model_turbo` / `-created_at` |
| `page` | int | 1 | Số trang |
| `page_size` | int | 50 | Số SP / trang (max 200) |

### 5.2 Product Detail API

```
GET /api/v1/products/{id}/
```

**Response 200:** (giống object trong list + có thể thêm `related_products`)

### 5.3 Product Stats API

```
GET /api/v1/products/stats/
```

**Response 200:**
```json
{
  "total_products": 1234,
  "total_active": 1200,
  "sheets": [
    {"name": "BÁO GIÁ", "count": 500},
    {"name": "BÁO GIÁ 2", "count": 400}
  ],
  "price_range": {
    "min": 500000,
    "max": 85000000
  },
  "by_phan_loai": {
    "co_gia_vip": 800,
    "co_gia_uu_dai": 900,
    "co_gia_dai_ly": 700,
    "co_gia_chung": 1234
  },
  "last_import": "2026-06-09T15:30:00Z"
}
```

### 5.4 Customers API

```
GET /api/v1/customers/
GET /api/v1/customers/search/?q=...
GET /api/v1/customers/{id}/
```

**Search customer response:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 5,
      "ma_kh": "KH001",
      "ten_kh": "Nguyễn Văn A",
      "dien_thoai": "0903123456",
      "phan_loai": "VIP",
      "dia_chi": "123 Nguyễn Huệ, Q.1",
      "tinh_tp": "TP.HCM",
      "ghi_chu": "Khách quen, thanh toán chậm 30 ngày",
      "nha_xe": "Xe A.Bình"
    }
  ]
}
```

**Customer search query params:**
| Param | Type | Mô tả |
|-------|------|-------|
| `q` | string | Search trong: ten_kh, ma_kh, dien_thoai, dia_chi |

### 5.5 Quotation API

```
POST /api/v1/quotations/preview/
```

**Request body:**
```json
{
  "product_ids": [1, 5, 23, 67],
  "customer_id": 5
}
```

**Response 200:**
```json
{
  "customer": {
    "ten_kh": "Nguyễn Văn A",
    "phan_loai": "VIP",
    "dien_thoai": "0903123456",
    "dia_chi": "123 Nguyễn Huệ, Q.1",
    "tinh_tp": "TP.HCM",
    "nha_xe": "Xe A.Bình",
    "ghi_chu": "Khách quen"
  },
  "quote_number": "BG20260610-04",
  "quote_date": "10/06/2026",
  "gia_ap_dung": "GIÁ VIP",
  "products": [
    {
      "id": 1,
      "ma_vt": "TURBO-001",
      "model_turbo": "GT3582R",
      "ma_dong_co": "4D56",
      "oem_part_no": "49135-03130",
      "dac_diem": "Bạc dầu, cánh 11",
      "ung_dung": "Mitsubishi Triton 2.5L",
      "don_gia": 7500000,
      "so_luong": 1,
      "thanh_tien": 7500000
    }
  ],
  "tong_cong": 28500000,
  "tong_chu": "hai mươi tám triệu năm trăm nghìn đồng",
  "company": {
    "name": "TURBO DIESEL",
    "address": "...",
    "phone": "...",
    "email": "...",
    "tax_code": "...",
    "bank": "...",
    "terms": "..."
  }
}
```

```
POST /api/v1/quotations/export-csv/
```

**Request body:** (giống preview)

**Response:** File CSV với BOM UTF-8

### 5.6 Import API (Admin)

```
POST /api/v1/import/excel/
Content-Type: multipart/form-data

file: <file .xlsx>
```

**Response 200:**
```json
{
  "status": "SUCCESS",
  "import_log_id": 12,
  "file_name": "BAO_GIA_TURBO.xlsx",
  "file_size": 2048576,
  "products_created": 450,
  "products_updated": 23,
  "customers_created": 5,
  "customers_updated": 30,
  "errors": [],
  "sheets_processed": ["BÁO GIÁ", "BÁO GIÁ 2", "DANH SÁCH KH"]
}
```

---

## VI. Excel Import — Giải Pháp

### 6.1 Chiến Lược Import

```
1. User upload file Excel (.xlsx)
2. Lưu file vào media/imports/
3. Mở file bằng openpyxl hoặc zipfile (như script gốc)
4. Detect sheet nào là BÁO GIÁ (có header: MÃ VT, MODEL TURBO...)
5. Detect sheet nào là DANH SÁCH KH (có header: Tên KH, ĐT...)
6. Parse từng dòng → tạo/update Product hoặc Customer
7. Log kết quả vào ImportLog
8. Trả về response
```

### 6.2 Detect Sheet Type

```python
# services/excel_importer.py

PRODUCT_HEADER_KEYWORDS = ['mã vt', 'model turbo', 'mã động cơ', 'oem']
CUSTOMER_HEADER_KEYWORDS = ['tên kh', 'danh sách kh', 'khách hàng', 'điện thoại', 'sđt']


def detect_sheet_type(headers: list[str]) -> str:
    """
    Phân loại sheet dựa vào header:
    - 'product': Sheet BÁO GIÁ
    - 'customer': Sheet DANH SÁCH KH
    - 'unknown': Không xác định → skip
    """
    header_text = ' '.join(h.lower() for h in headers)

    # Check customer trước (dễ nhận diện hơn)
    if any(kw in header_text for kw in CUSTOMER_HEADER_KEYWORDS):
        return 'customer'

    if any(kw in header_text for kw in PRODUCT_HEADER_KEYWORDS):
        return 'product'

    # Fallback: nếu có nhiều cột giá → product
    price_cols = sum(1 for h in headers if 'giá' in h.lower())
    if price_cols >= 3:
        return 'product'

    return 'unknown'
```

### 6.3 Cột Mapping — Linh Hoạt

Thay vì hardcode vị trí cột, dùng fuzzy matching header:

```python
COLUMN_MAPPING = {
    # Product columns — tên header → field
    'mã vt': 'ma_vt',
    'mã vật tư': 'ma_vt',
    'mã sp': 'ma_vt',
    'tên sp': 'ten_sp',
    'tên sản phẩm': 'ten_sp',
    'model turbo': 'model_turbo',
    'model': 'model_turbo',
    'mã động cơ': 'ma_dong_co',
    'oem part no': 'oem_part_no',
    'oem': 'oem_part_no',
    'đặc điểm': 'dac_diem',
    'ứng dụng': 'ung_dung',
    'hình ảnh': 'hinh_anh',
    'ảnh': 'hinh_anh',
    'giá chung': 'gia_chung',
    'giá vip': 'gia_vip',
    'giá ưu đãi': 'gia_uu_dai',
    'giá đại lý': 'gia_dai_ly',
    'giá đl+10%': 'gia_dl_10',
    'giá đl': 'gia_dl_10',
}

def map_columns(headers: list[str]) -> dict[int, str]:
    """
    Input: ['STT', 'MÃ VT', 'MODEL TURBO', ...]
    Output: {0: 'ma_vt', 2: 'model_turbo', ...}
    """
    mapping = {}
    for idx, header in enumerate(headers):
        header_lower = header.strip().lower()
        for pattern, field in COLUMN_MAPPING.items():
            if pattern in header_lower:
                mapping[idx] = field
                break
    return mapping
```

### 6.4 Parse Giá — Xử Lý Định Dạng

Giá trong Excel có thể là: `"5.500.000"`, `"5,500,000"`, `"5.500.000 ₫"`, `"Liên hệ"`, `""`

```python
import re

def parse_price(value) -> Decimal | None:
    """Parse giá từ text → Decimal."""
    if not value:
        return None

    text = str(value).strip()

    # "Liên hệ" → None
    if re.search(r'li[êe]n\s*h[ệe]', text, re.IGNORECASE):
        return None

    # Extract số: "5.500.000 ₫" → 5500000
    numbers = re.findall(r'[\d,.]+', text)
    if not numbers:
        return None

    # Lấy số đầu tiên, clean dấu phân cách
    raw = numbers[0]
    # Nếu có cả . và , → cái cuối cùng là decimal separator
    if '.' in raw and ',' in raw:
        # Format: 5.500.000,00 → 5500000
        raw = raw.replace('.', '').replace(',', '.')
    elif '.' in raw:
        # Check: 5.500.000 hay 5500.00
        parts = raw.split('.')
        if len(parts[-1]) == 3 and len(parts) > 1:
            # Dạng 5.500.000 → xóa .
            raw = raw.replace('.', '')
        # else: dạng 5500.00 → giữ nguyên
    elif ',' in raw:
        parts = raw.split(',')
        if len(parts[-1]) == 3 and len(parts) > 1:
            raw = raw.replace(',', '')
        else:
            raw = raw.replace(',', '.')

    try:
        return Decimal(raw)
    except (ValueError, InvalidOperation):
        return None
```

---

## VII. Quotation HTML Generator

### 7.1 Giải Pháp

Dùng Django Template Engine để render HTML báo giá. Template này giữ nguyên định dạng từ script gốc.

```python
# services/quotation_generator.py

from django.template.loader import render_to_string
from decimal import Decimal

def generate_quotation_html(
    products: list[dict],
    customer: dict,
    company_config: dict,
    quote_number: str,
    quote_date: str,
) -> str:
    """
    Sinh HTML báo giá từ template Django.

    Args:
        products: List[dict] — mỗi dict có: ma_vt, model_turbo, ma_dong_co,
                  oem_part_no, dac_diem, ung_dung, don_gia, thanh_tien
        customer: dict — thông tin KH đã chọn
        company_config: dict — cấu hình công ty từ settings
        quote_number: str — Số báo giá (BG20260610-04)
        quote_date: str — Ngày báo giá

    Returns:
        str — Full HTML
    """
    gia_ap_dung = get_gia_label(customer['phan_loai'])
    tong_cong = sum(p['thanh_tien'] for p in products)

    context = {
        'quote_number': quote_number,
        'quote_date': quote_date,
        'customer': customer,
        'products': products,
        'gia_ap_dung': gia_ap_dung,
        'tong_cong': tong_cong,
        'tong_chu': number_to_vietnamese_words(tong_cong),
        'company': company_config,
        'generated_at': datetime.now().isoformat(),
    }

    return render_to_string('quotation/base.html', context)
```

### 7.2 Template HTML

Template sử dụng CSS inline để in được đẹp (giữ nguyên style từ script gốc).

```django
{# templates/quotation/base.html #}
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Báo Giá {{ quote_number }}</title>
<style>
  {# CSS giữ nguyên từ script gốc — xem PLAN.md mục quotation CSS #}
</style>
</head>
<body>
  <div class="quote-header">
    <div class="logo">{{ company.name }}</div>
    <div class="slogan">{{ company.slogan }}</div>
    <div class="company-info">
      📍 {{ company.address }} · 📞 {{ company.phone }} · ✉️ {{ company.email }}<br>
      MST: {{ company.tax_code }} · {{ company.bank }}
    </div>
  </div>

  <div class="quote-title">BÁO GIÁ</div>

  <div class="quote-meta">
    <div class="meta-box">
      <div class="meta-label">Số báo giá / Ngày</div>
      <div class="meta-value">{{ quote_number }} · {{ quote_date }}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Khách hàng</div>
      <div class="meta-value">{{ customer.ten_kh }}</div>
      <div style="font-size:9px;color:#64748b">
        📞 {{ customer.dien_thoai }} · 📍 {{ customer.dia_chi }} · {{ customer.tinh_tp }}
      </div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Phân loại / Giá áp dụng</div>
      <div class="meta-value">{{ customer.phan_loai }} — {{ gia_ap_dung }}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>MÃ VT</th>
        <th>MODEL TURBO</th>
        <th>MÃ ĐỘNG CƠ</th>
        <th>OEM PART NO</th>
        <th>ĐẶC ĐIỂM</th>
        <th>ỨNG DỤNG</th>
        <th>ĐƠN GIÁ</th>
        <th>SL</th>
        <th>THÀNH TIỀN</th>
      </tr>
    </thead>
    <tbody>
      {% for p in products %}
      <tr>
        <td>{{ forloop.counter }}</td>
        <td>{{ p.ma_vt }}</td>
        <td>{{ p.model_turbo }}</td>
        <td>{{ p.ma_dong_co }}</td>
        <td>{{ p.oem_part_no|first_oem }}</td>
        <td>{{ p.dac_diem }}</td>
        <td>{{ p.ung_dung }}</td>
        <td class="num">{{ p.don_gia|vnd_format }}</td>
        <td class="num">1</td>
        <td class="num">{{ p.thanh_tien|vnd_format }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

  <div class="quote-total">
    TỔNG CỘNG: {{ tong_cong|vnd_format }}
  </div>
  <div style="text-align:right">({{ tong_chu }})</div>

  <div class="quote-terms">
    <strong>Điều khoản:</strong>
    {{ company.terms }}

    <strong>Người nhận hàng:</strong> {{ customer.ten_kh }} — {{ customer.dien_thoai }}
    <strong>Nhà xe:</strong> {{ customer.nha_xe|default:"Không có" }}
    <strong>Ghi chú KH:</strong> {{ customer.ghi_chu|default:"Không có" }}
  </div>

  <div class="quote-sign">
    <div class="sign-box">
      <div class="sign-line">KHÁCH HÀNG</div>
      <div>(Ký, ghi rõ họ tên)</div>
    </div>
    <div class="sign-box">
      <div class="sign-line">{{ company.signature }}</div>
      <div>(Ký, đóng dấu)</div>
    </div>
  </div>

  <div style="text-align:center;margin-top:30px;font-size:8px;color:#999">
    🤖 Báo giá được tạo tự động — {{ quote_date }}
  </div>
</body>
</html>
```

---

## VIII. Settings & Config

### 8.1 Django Settings (Key Parts)

```python
# backend/settings.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'django_filters',
    'corsheaders',
    # Local
    'products',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Phải trên CommonMiddleware
    'django.middleware.security.SecurityMiddleware',
    # ...
]

# ── CORS ──
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173'
).split(',')

# ── DRF ──
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'MAX_PAGE_SIZE': 200,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/minute',  # 2 req/s cho search
    },
}

# ── Company Config ──
COMPANY_CONFIG = {
    'name': os.getenv('COMPANY_NAME', 'TURBO DIESEL'),
    'slogan': os.getenv('COMPANY_SLOGAN', 'Chuyên Cung Cấp Turbo & Phụ Tùng Động Cơ'),
    'address': os.getenv('COMPANY_ADDRESS', 'Địa chỉ công ty của bạn'),
    'phone': os.getenv('COMPANY_PHONE', '09xx.xxx.xxx'),
    'email': os.getenv('COMPANY_EMAIL', 'email@turbodiesel.com'),
    'tax_code': os.getenv('COMPANY_TAX_CODE', 'Mã số thuế của bạn'),
    'bank': os.getenv('COMPANY_BANK', 'Ngân hàng: ... - STK: ...'),
    'terms': os.getenv('COMPANY_TERMS', '- Bảo hành: 6 tháng...\n- Đổi trả trong 7 ngày...'),
    'signature': os.getenv('COMPANY_SIGNATURE', 'TURBO DIESEL'),
}
```

### 8.2 URL Router

```python
# backend/urls.py
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('products.urls')),
]
```

```python
# products/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Products
    path('products/', views.ProductListCreateView.as_view(), name='product-list'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/stats/', views.ProductStatsView.as_view(), name='product-stats'),

    # Customers
    path('customers/', views.CustomerListView.as_view(), name='customer-list'),
    path('customers/search/', views.CustomerSearchView.as_view(), name='customer-search'),
    path('customers/<int:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),

    # Quotations
    path('quotations/preview/', views.QuotationPreviewView.as_view(), name='quotation-preview'),
    path('quotations/export-csv/', views.QuotationExportCSVView.as_view(), name='quotation-export-csv'),

    # Import
    path('import/excel/', views.ExcelImportView.as_view(), name='import-excel'),
]
```

---

## IX. Views — Triển Khai Chính

### 9.1 Product Search View

```python
# products/views.py

class ProductListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/products/       — List + Search + Filter
    POST /api/v1/products/       — Create (admin only sau này)
    """
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, ProductSearchFilter]
    filterset_class = ProductFilter
    ordering_fields = ['ma_vt', 'model_turbo', 'created_at']
    ordering = ['ma_vt']
    pagination_class = ProductPagination


class ProductSearchFilter(filters.BaseFilterBackend):
    """Custom filter backend cho search đa trường."""

    def filter_queryset(self, request, queryset, view):
        q = request.query_params.get('q', '').strip()
        if not q:
            return queryset

        if settings.USE_POSTGRES_SEARCH:
            return self._search_postgres(queryset, q)
        return self._search_sqlite(queryset, q)

    def _search_sqlite(self, queryset, q):
        return queryset.filter(
            Q(ma_vt__icontains=q) |
            Q(ten_sp__icontains=q) |
            Q(model_turbo__icontains=q) |
            Q(ma_dong_co__icontains=q) |
            Q(oem_part_no__icontains=q) |
            Q(dac_diem__icontains=q) |
            Q(ung_dung__icontains=q)
        )

    def _search_postgres(self, queryset, q):
        return (
            queryset
            .annotate(
                similarity=(
                    TrigramSimilarity('ma_vt', q) * 1.5 +
                    TrigramSimilarity('model_turbo', q) * 1.2 +
                    TrigramSimilarity('oem_part_no', q) * 1.2 +
                    TrigramSimilarity('ma_dong_co', q) * 1.0 +
                    TrigramSimilarity('ten_sp', q) * 0.8 +
                    TrigramSimilarity('dac_diem', q) * 0.5 +
                    TrigramSimilarity('ung_dung', q) * 0.3
                )
            )
            .filter(similarity__gt=0.05)
            .order_by('-similarity')
        )
```

### 9.2 Customer Search View

```python
class CustomerSearchView(generics.ListAPIView):
    """
    GET /api/v1/customers/search/?q=...
    Autocomplete — search theo tên, mã, SĐT, địa chỉ.
    """
    queryset = Customer.objects.filter(is_active=True)
    serializer_class = CustomerSerializer
    pagination_class = None  # Không phân trang cho autocomplete

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        if not q or len(q) < 1:
            return Customer.objects.none()

        return Customer.objects.filter(
            Q(ten_kh__icontains=q) |
            Q(ma_kh__icontains=q) |
            Q(dien_thoai__icontains=q) |
            Q(dia_chi__icontains=q)
        ).order_by('ten_kh')[:12]  # Limit 12 results
```

### 9.3 Quotation Preview View

```python
class QuotationPreviewView(generics.GenericAPIView):
    """
    POST /api/v1/quotations/preview/
    """
    serializer_class = QuotationRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_ids = serializer.validated_data['product_ids']
        customer_id = serializer.validated_data['customer_id']

        customer = get_object_or_404(Customer, id=customer_id, is_active=True)
        products_qs = Product.objects.filter(
            id__in=product_ids, is_active=True
        ).order_by('ma_vt')

        # Build product list with correct price
        products_data = []
        tong_cong = Decimal('0')
        for p in products_qs:
            don_gia = p.get_price_for_type(customer.phan_loai) or Decimal('0')
            thanh_tien = don_gia  # SL = 1 default
            tong_cong += thanh_tien
            products_data.append({
                'id': p.id,
                'ma_vt': p.ma_vt,
                'model_turbo': p.model_turbo,
                'ma_dong_co': p.ma_dong_co,
                'oem_part_no': p.oem_part_no,
                'dac_diem': p.dac_diem,
                'ung_dung': p.ung_dung,
                'don_gia': don_gia,
                'so_luong': 1,
                'thanh_tien': thanh_tien,
            })

        quote_number = f"BG{datetime.now().strftime('%Y%m%d')}-{len(product_ids):02d}"
        quote_date = datetime.now().strftime('%d/%m/%Y')
        gia_ap_dung = get_gia_label(customer.phan_loai)

        return Response({
            'quote_number': quote_number,
            'quote_date': quote_date,
            'customer': CustomerSerializer(customer).data,
            'gia_ap_dung': gia_ap_dung,
            'products': products_data,
            'tong_cong': tong_cong,
            'tong_chu': number_to_vietnamese_words(tong_cong),
            'company': settings.COMPANY_CONFIG,
        })
```

---

## X. Performance & Tối Ưu

### 10.1 Database Indexes

```sql
-- Đã có trong model Meta.indexes:
-- products: ma_vt, model_turbo, oem_part_no, sheet_name, is_active
-- customers: ten_kh, dien_thoai, phan_loai
```

### 10.2 Query Optimization

```python
# Dùng select_related / prefetch_related khi cần
# Dùng .only() khi chỉ cần 1 số trường
# Dùng .defer() để bỏ qua text field lớn khi list

class ProductListCreateView(generics.ListAPIView):
    def get_queryset(self):
        # Khi list, defer text fields lớn (chỉ load khi detail)
        return Product.objects.filter(is_active=True).defer(
            'dac_diem', 'ung_dung', 'oem_part_no'
        )
```

### 10.3 Caching

```python
# Cache product stats (thay đổi chậm)
from django.core.cache import cache

class ProductStatsView(generics.GenericAPIView):
    def get(self, request):
        cache_key = 'product_stats'
        stats = cache.get(cache_key)
        if stats is None:
            stats = self._compute_stats()
            cache.set(cache_key, stats, timeout=300)  # Cache 5 phút
        return Response(stats)
```

### 10.4 Rate Limiting

```python
# Đã config trong DRF throttling:
# 120 req/min cho search API
# Tránh spam search làm nặng DB
```

---

## XI. Error Handling

```python
# backend/errors.py
from rest_framework.views import exception_handler

def turbo_exception_handler(exc, context):
    """Custom exception handler — format lỗi tiếng Việt."""
    response = exception_handler(exc, context)

    if response is not None:
        # Chuẩn hóa error format
        errors = response.data
        response.data = {
            'success': False,
            'errors': errors,
            'message': _get_vietnamese_error_message(response.status_code, errors),
        }

    return response


def _get_vietnamese_error_message(status_code, errors):
    messages = {
        400: 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.',
        404: 'Không tìm thấy dữ liệu yêu cầu.',
        429: 'Bạn đang gửi quá nhiều yêu cầu. Vui lòng đợi một chút.',
        500: 'Lỗi máy chủ. Vui lòng thử lại sau.',
    }
    return messages.get(status_code, 'Có lỗi xảy ra.')
```

---

## XII. Testing Strategy

```python
# tests/test_products.py

class ProductAPITestCase(APITestCase):
    """Test product search & filter API."""

    def setUp(self):
        # Tạo 50 products test
        Product.objects.bulk_create([...])

    def test_search_by_ma_vt(self):
        response = self.client.get('/api/v1/products/', {'q': 'TURBO-001'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_no_results(self):
        response = self.client.get('/api/v1/products/', {'q': 'xxxxxxxxx'})
        self.assertEqual(response.data['count'], 0)

    def test_filter_by_price_range(self):
        response = self.client.get('/api/v1/products/', {
            'min_price': 5000000,
            'max_price': 10000000,
        })
        # Tất cả SP trong range
        for p in response.data['results']:
            price = p['gia_vip'] or p['gia_chung'] or 0
            self.assertTrue(5000000 <= price <= 10000000)

    def test_pagination(self):
        response = self.client.get('/api/v1/products/', {'page_size': 20})
        self.assertLessEqual(len(response.data['results']), 20)
```

---

## XIII. Triển Khai — Dev Setup

### 13.1 Cài Đặt

```bash
# 1. Tạo virtual environment
cd elearning-project
python -m venv venv
source venv/Scripts/activate  # Windows
# source venv/bin/activate     # Mac/Linux

# 2. Cài dependencies
pip install django djangorestframework django-cors-headers django-filter openpyxl

# 3. Tạo Django project
django-admin startproject backend .
cd backend
python manage.py startapp products

# 4. Migrate
python manage.py makemigrations
python manage.py migrate

# 5. Import dữ liệu mẫu
python manage.py seed_data
# HOẶC import từ Excel:
python manage.py import_excel "../doc-file-excell/BÁO_GIÁ_TURBO CLAUDE.xlsx"

# 6. Chạy server
python manage.py runserver 8000
```

### 13.2 Environment Variables

```bash
# .env
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:5173
USE_POSTGRES_SEARCH=False

# Company config
COMPANY_NAME=TURBO DIESEL
COMPANY_SLOGAN=Chuyên Cung Cấp Turbo & Phụ Tùng Động Cơ
COMPANY_ADDRESS=Địa chỉ công ty của bạn
COMPANY_PHONE=09xx.xxx.xxx
COMPANY_EMAIL=email@turbodiesel.com
```

---

## XIV. Tổng Kết — Checklist Triển Khai

- [ ] Django project + settings (DRF, CORS, filter)
- [ ] Models: Product, Customer, ImportLog + migrate
- [ ] ProductSerializer + ProductFilter + ProductSearchFilter
- [ ] CustomerSerializer + CustomerSearchView
- [ ] ProductListCreateView (search + filter + pagination)
- [ ] ProductStatsView
- [ ] QuotationPreviewView + QuotationExportCSVView
- [ ] ExcelImportView + management command
- [ ] `import_excel.py` — parse Excel linh hoạt
- [ ] `quotation_generator.py` + template HTML báo giá
- [ ] Custom exception handler
- [ ] `seed_data.py` — tạo 50 SP + 20 KH mẫu
- [ ] URL routing `/api/v1/...`
- [ ] Rate limiting (120 req/min)
- [ ] Cache cho stats API
- [ ] Tests

---

## ✅ Duyệt Plan Backend

- Gõ **"OK BE"** → Tôi code Django backend ngay
- Gõ **"Sửa phần X"** → Tôi sửa theo ý bạn
