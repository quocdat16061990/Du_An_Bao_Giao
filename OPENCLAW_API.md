# Turbo Diesel API Guide for OpenClaw

Tài liệu này mô tả API hiện có của dự án để OpenClaw có thể dùng như một trợ lý báo giá/phân tích bán hàng.

Không cho OpenClaw truy cập database trực tiếp. OpenClaw chỉ nên gọi Django REST API.

```text
OpenClaw
  -> custom tool/plugin
  -> Django REST API
  -> Supabase/PostgreSQL
```

## Base URL

Local dev:

```text
http://localhost:8000/api/v1
```

Frontend dev proxy thường dùng:

```text
http://localhost:5173/api/v1
```

Production hiện tại:

```text
https://luanmienam.devoverflow.xyz/api/v1
```

## Auth

API dùng JWT qua SimpleJWT.

OpenClaw nên luôn dùng JWT, kể cả với endpoint GET, để tránh khác biệt giữa dev/prod.

Header chuẩn:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Login

```http
POST /auth/login/
```

Request:

```json
{
  "username": "admin",
  "password": "your-password"
}
```

Response:

```json
{
  "access": "jwt-access-token",
  "refresh": "jwt-refresh-token"
}
```

### Refresh Token

```http
POST /auth/refresh/
```

Request:

```json
{
  "refresh": "jwt-refresh-token"
}
```

Response:

```json
{
  "access": "new-jwt-access-token",
  "refresh": "new-jwt-refresh-token"
}
```

### Verify Token

```http
POST /auth/verify/
```

Request:

```json
{
  "token": "jwt-access-token"
}
```

### Current User

```http
GET /auth/me/
```

Response:

```json
{
  "id": 1,
  "username": "admin",
  "email": "",
  "is_staff": true,
  "display_name": "admin"
}
```

## Core Data Model

Các bảng nghiệp vụ chính:

```text
Product
Customer
Quotation
QuotationItem
Category
HangMay
HangSx
ThuongHieu
NhaXe
```

Luồng nghiệp vụ chính:

```text
Tìm sản phẩm
  -> tìm hoặc tạo khách hàng
  -> preview báo giá
  -> lưu báo giá
  -> xuất Excel nếu cần
  -> cập nhật trạng thái báo giá
```

## Enums

### Quotation Status

```text
DA_GUI   = Đã gửi
DA_CHOT  = Đã chốt
THUA     = Thua
```

Khi OpenClaw cập nhật trạng thái báo giá, chỉ dùng 3 giá trị này.

### Customer `phan_loai`

Model hiện tại hỗ trợ:

```text
VIP
ƯU_ĐÃI
NGOẠI_LỆ
CHƯA_PL
```

Ghi chú: logic giá sản phẩm có nhắc tới `ĐẠI_LÝ`, nhưng `Customer` model hiện chưa khai báo `ĐẠI_LÝ` trong choices. Khi OpenClaw tạo khách mới, nên để mặc định `CHƯA_PL` nếu không chắc.

## Products API

### Search/List Products

```http
GET /products/
```

Query params thường dùng:

```text
q             search text: mã vật tư, tên hàng, model, mã động cơ, OEM, parno...
page          default 1
page_size     default 20, max 100
ordering      ví dụ: ma_vt, -created_at, gia_vip, gia_dai_ly
category      category id
category_slug exact slug
hang_may      hãng máy id
hang_sx       hãng sản xuất id
thuong_hieu   thương hiệu id
loai          loại sản phẩm
min_price     lọc giá thấp nhất
max_price     lọc giá cao nhất
phan_loai_gia vip | uu_dai | dai_ly | dl_10
sheet         tên sheet chứa text
```

Ví dụ:

```http
GET /products/?q=piston%20komatsu&page=1&page_size=10
```

Response dạng phân trang:

```json
{
  "count": 5792,
  "next": "http://.../api/v1/products/?page=2",
  "previous": null,
  "total_pages": 580,
  "current_page": 1,
  "results": [
    {
      "id": 14978,
      "loai": "piston",
      "ma_vt": "ABC123",
      "ten_hang": "Piston Komatsu...",
      "model_turbo": "",
      "ma_dong_co": "",
      "oem_part_no": "",
      "parno": "",
      "hang_may": 1,
      "hang_may_name": "KOMATSU",
      "category": 10,
      "category_name": "Piston",
      "gia_vip": "1000000",
      "gia_uu_dai": "950000",
      "gia_dai_ly": "900000",
      "gia_gara": null,
      "gia_dl_10": "990000",
      "hinh_anh": "",
      "is_active": true,
      "created_at": "2026-06-26T..."
    }
  ]
}
```

OpenClaw tool gợi ý:

```text
search_products(query, page_size=10, category_id?, hang_may_id?)
```

### Product Detail

```http
GET /products/{id}/
```

Dùng khi OpenClaw cần xem đủ thông tin kỹ thuật, ghi chú, attributes, giá.

### Product Stats

```http
GET /products/stats/
```

Response:

```json
{
  "totalProducts": 5792,
  "totalActive": 5792,
  "byLoai": {
    "turbo": 100,
    "ruot": 50
  },
  "byCategory": [],
  "byHangMay": [],
  "byThuongHieu": [],
  "priceRange": {
    "min": "100000",
    "max": "10000000"
  },
  "lastImport": null
}
```

## Catalog APIs

Các endpoint này dùng để lấy option/filter.

```http
GET /categories/
GET /hang-may/
GET /hang-sx/
GET /thuong-hieu/
GET /nha-xe/
```

### Categories Response

```json
[
  {
    "id": 1,
    "ten": "Piston",
    "slug": "piston",
    "mo_ta": "",
    "order": 1,
    "product_count": 120
  }
]
```

### Hang May Response

```json
[
  {
    "id": 1,
    "ten": "KOMATSU",
    "slug": "komatsu"
  }
]
```

## Customers API

### List/Create Customers

```http
GET /customers/
POST /customers/
```

### Search Customers

```http
GET /customers/search/?q=<keyword>
```

Search theo:

```text
ten_kh
ma_kh
dien_thoai
dia_chi
```

Response:

```json
[
  {
    "id": 123,
    "ma_kh": "KH001",
    "ten_kh": "Anh Hòa",
    "dien_thoai": "0973137313",
    "phan_loai": "CHƯA_PL",
    "dia_chi": "",
    "tinh_tp": ""
  }
]
```

OpenClaw tool gợi ý:

```text
search_customers(keyword)
```

### Create Customer

```http
POST /customers/
```

Request tối thiểu:

```json
{
  "ten_kh": "Anh Hòa",
  "dien_thoai": "0973137313",
  "phan_loai": "CHƯA_PL",
  "dia_chi": "",
  "tinh_tp": "",
  "ghi_chu": ""
}
```

`ma_kh` có thể bỏ trống. Backend tự sinh mã khách hàng.

Response:

```json
{
  "id": 5051,
  "ma_kh": "KH260626123456",
  "ten_kh": "Anh Hòa",
  "dien_thoai": "0973137313",
  "phan_loai": "CHƯA_PL",
  "dia_chi": "",
  "tinh_tp": "",
  "ghi_chu": "",
  "nha_xe": null,
  "nha_xe_name": "",
  "is_active": true,
  "created_at": "2026-06-26T..."
}
```

OpenClaw tool gợi ý:

```text
create_customer(name, phone?, address?, province?, note?)
```

Nên yêu cầu user xác nhận trước khi tạo khách mới.

### Customer Detail

```http
GET /customers/{id}/
```

## Quotation APIs

### Preview Quotation

Preview chỉ tính giá và trả dữ liệu báo giá, không lưu DB.

```http
POST /quotations/preview/
```

Request:

```json
{
  "customer_id": 123,
  "product_ids": [14978, 14977]
}
```

Rules:

```text
product_ids required, min 1
product_ids max 200
customer_id required
```

Response:

```json
{
  "quote_number": "BG20260626-02",
  "quote_date": "26/06/2026",
  "customer": {
    "id": 123,
    "ten_kh": "Anh Hòa",
    "phan_loai": "CHƯA_PL"
  },
  "gia_ap_dung": "GIÁ ĐL+10%",
  "products": [
    {
      "id": 14978,
      "ma_vt": "ABC123",
      "ten_hang": "Piston...",
      "model_turbo": "",
      "ma_dong_co": "",
      "oem_part_no": "",
      "dac_diem": "",
      "ung_dung": "",
      "don_gia": 1000000,
      "so_luong": 1,
      "thanh_tien": 1000000
    }
  ],
  "tong_cong": 1000000,
  "tong_chu": "1,000,000 VNĐ",
  "company": {}
}
```

OpenClaw tool gợi ý:

```text
preview_quotation(customer_id, product_ids)
```

### Save Quotation

Lưu báo giá vào database.

```http
POST /quotations/save/
```

Request:

```json
{
  "customer_id": 123,
  "product_ids": [14978, 14977],
  "nhan_vien": ""
}
```

Vì app hiện tại chỉ một người dùng, `nhan_vien` có thể để rỗng hoặc đặt là tên chủ shop.

Response:

```json
{
  "success": true,
  "id": 12,
  "quote_number": "BG20260626114643-02"
}
```

OpenClaw tool gợi ý:

```text
save_quotation(customer_id, product_ids, staff_name?)
```

Nên yêu cầu user xác nhận trước khi gọi endpoint này vì nó tạo dữ liệu thật.

### Export Excel

```http
POST /quotations/export-excel/
```

Request:

```json
{
  "customer_id": 123,
  "product_ids": [14978, 14977]
}
```

Response:

```text
Binary .xlsx file
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

OpenClaw tool gợi ý:

```text
export_quotation_excel(customer_id, product_ids)
```

Ghi chú: endpoint này chỉ xuất file Excel, không nhất thiết lưu quotation. Nếu muốn chắc chắn lưu lịch sử, gọi `/quotations/save/` trước.

### Export CSV

```http
POST /quotations/export-csv/
```

Request giống Excel.

Response:

```text
CSV text
```

### Export PDF

```http
POST /quotations/export-pdf/
```

Hiện endpoint này trả:

```json
{
  "error": "PDF export is disabled. Please use Excel export."
}
```

Status:

```text
410 Gone
```

OpenClaw không nên dùng endpoint PDF backend hiện tại.

### Today Quotations

```http
GET /quotations/today/
```

Response:

```json
[
  {
    "id": 12,
    "quote_number": "BG20260626114643-02",
    "quote_date": "2026-06-26",
    "customer_id": 123,
    "customer_name": "Trần Hữu Quốc Đạt",
    "customer_phone": "",
    "gia_ap_dung": "GIÁ ĐL+10%",
    "tong_cong": "0",
    "product_count": 2,
    "nhan_vien": "",
    "status": "DA_GUI",
    "status_display": "Đã gởi",
    "ghi_chu": "",
    "created_at": "2026-06-26T04:46:43Z",
    "updated_at": "2026-06-26T04:46:43Z",
    "items": [
      {
        "id": 1,
        "ma_vt": "ABC123",
        "ten_hang": "Tên hàng",
        "don_gia": "0",
        "so_luong": 1,
        "thanh_tien": "0"
      }
    ]
  }
]
```

### Today Stats

```http
GET /quotations/today/stats/
```

Response:

```json
{
  "tong_bg": 12,
  "tong_sp": 33,
  "tong_tien": 53350000,
  "so_kh": 8,
  "da_chot": 0,
  "da_gui": 12,
  "thua": 0
}
```

OpenClaw tool gợi ý:

```text
get_today_quotation_stats()
```

### History Quotations

```http
GET /quotations/history/
```

Query params:

```text
date_from YYYY-MM-DD
date_to   YYYY-MM-DD
```

Ví dụ:

```http
GET /quotations/history/?date_from=2026-06-01&date_to=2026-06-30
```

Nếu không truyền date range, backend mặc định lấy hôm nay.

Response giống `/quotations/today/`.

OpenClaw tool gợi ý:

```text
list_quotations(date_from, date_to)
```

### History Stats

```http
GET /quotations/history/stats/?date_from=2026-06-01&date_to=2026-06-30
```

Response:

```json
{
  "tong_bg": 12,
  "tong_sp": 33,
  "tong_tien": 53350000,
  "so_kh": 8,
  "da_chot": 0,
  "da_gui": 12,
  "thua": 0
}
```

OpenClaw tool gợi ý:

```text
get_quotation_stats(date_from, date_to)
```

Agent có thể tự tính thêm:

```text
win_rate = da_chot / tong_bg
lost_rate = thua / tong_bg
avg_products_per_quote = tong_sp / tong_bg
avg_quote_value = tong_tien / tong_bg
```

### Update Quotation Status

```http
PATCH /quotations/{id}/update/
```

Request:

```json
{
  "status": "DA_CHOT",
  "ghi_chu": "Khách đã đồng ý, chờ thanh toán",
  "nhan_vien": ""
}
```

Response:

```json
{
  "status": "DA_CHOT",
  "ghi_chu": "Khách đã đồng ý, chờ thanh toán",
  "nhan_vien": ""
}
```

OpenClaw tool gợi ý:

```text
update_quotation_status(quotation_id, status, note?)
```

Nên yêu cầu user xác nhận trước khi cập nhật.

## Recommended OpenClaw Tools

Nên tạo các tool nhỏ, rõ input/output:

```text
login(username, password)
search_products(query, page_size=10, filters?)
get_product_detail(product_id)
search_customers(keyword)
create_customer(name, phone?, address?, province?, note?)
preview_quotation(customer_id, product_ids)
save_quotation(customer_id, product_ids)
export_quotation_excel(customer_id, product_ids)
list_quotations(date_from, date_to)
get_quotation_stats(date_from, date_to)
update_quotation_status(quotation_id, status, note?)
```

## Safety Rules for OpenClaw

Read-only actions không cần hỏi lại:

```text
search_products
get_product_detail
search_customers
list_quotations
get_quotation_stats
get_today_quotation_stats
```

Write actions nên hỏi user xác nhận:

```text
create_customer
save_quotation
export_quotation_excel
update_quotation_status
```

Ví dụ xác nhận:

```text
Mình sẽ lưu báo giá cho khách Anh Hòa với 2 sản phẩm, tổng 3.250.000đ. Xác nhận lưu không?
```

## Example Workflows

### 1. User asks: "Tìm piston Komatsu cho anh Hòa"

Steps:

```text
1. search_customers("Hòa")
2. search_products("piston Komatsu")
3. Nếu có nhiều khách hoặc nhiều sản phẩm, hỏi user chọn.
4. preview_quotation(customer_id, product_ids)
5. Trả tổng tiền và danh sách sản phẩm.
```

### 2. User asks: "Lưu báo giá 2 món này cho anh Hòa"

Steps:

```text
1. Kiểm tra đã có customer_id.
2. Kiểm tra product_ids.
3. preview_quotation(customer_id, product_ids)
4. Hỏi xác nhận.
5. save_quotation(customer_id, product_ids)
6. Trả quote_number.
```

### 3. User asks: "Tháng này mình chốt được bao nhiêu?"

Steps:

```text
1. Tính date_from = ngày đầu tháng hiện tại.
2. Tính date_to = ngày cuối tháng hiện tại hoặc hôm nay.
3. get_quotation_stats(date_from, date_to)
4. Trả tong_bg, da_chot, thua, win_rate, tong_tien.
```

### 4. User asks: "Đánh dấu báo giá BG202606... là đã chốt"

Hiện API update dùng `id`, chưa có endpoint lookup bằng `quote_number`.

Steps:

```text
1. list_quotations(date range phù hợp)
2. Tìm quote_number trong kết quả.
3. Hỏi xác nhận.
4. update_quotation_status(id, "DA_CHOT", note?)
```

## Known Gaps

Các tính năng CRM nâng cao chưa có API/schema riêng:

```text
customer source
follow_up_at
lost_reason
won_at
lost_at
customer activity / call log
lead pipeline
```

Với schema hiện tại, OpenClaw đã làm tốt:

```text
tìm sản phẩm
tìm/tạo khách
preview báo giá
lưu báo giá
xuất Excel
xem dashboard cơ bản
cập nhật trạng thái báo giá
```

Muốn làm CRM cá nhân sâu hơn, cần bổ sung field/bảng sau:

```text
Customer.source
Quotation.follow_up_at
Quotation.won_at
Quotation.lost_at
Quotation.lost_reason
CustomerActivity
```

## Error Handling

Các lỗi thường gặp:

```text
401 Unauthorized
- Token thiếu hoặc hết hạn. Gọi /auth/refresh/ hoặc login lại.

404 Not Found
- customer_id không tồn tại hoặc khách inactive.
- product_id không tồn tại hoặc sản phẩm inactive.

400 Bad Request
- product_ids rỗng.
- product_ids quá 200 sản phẩm.
- phan_loai không hợp lệ khi tạo khách.

410 Gone
- /quotations/export-pdf/ đang disabled.
```

## Minimal Tool Prompt for OpenClaw

Có thể copy đoạn này vào instruction của OpenClaw:

```text
Bạn là trợ lý báo giá Turbo Diesel. Luôn gọi Django API, không truy cập database trực tiếp.

Base API: https://luanmienam.devoverflow.xyz/api/v1

Luôn dùng JWT Bearer token.

Khi người dùng hỏi tìm hàng, gọi /products/?q=...
Khi người dùng hỏi tìm khách, gọi /customers/search/?q=...
Khi cần tạo khách mới, gọi POST /customers/ nhưng phải hỏi xác nhận trước.
Khi cần báo giá, gọi POST /quotations/preview/ trước để kiểm tra tổng tiền.
Khi cần lưu báo giá, phải hỏi xác nhận rồi gọi POST /quotations/save/.
Khi cần xuất Excel, gọi POST /quotations/export-excel/.
Khi hỏi thống kê, gọi /quotations/history/stats/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD.
Khi cập nhật trạng thái báo giá, phải hỏi xác nhận rồi gọi PATCH /quotations/{id}/update/.

Trạng thái báo giá chỉ dùng: DA_GUI, DA_CHOT, THUA.
Phân loại khách nên dùng: VIP, ƯU_ĐÃI, NGOẠI_LỆ, CHƯA_PL. Nếu không chắc, dùng CHƯA_PL.
```
