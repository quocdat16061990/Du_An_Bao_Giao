# Tài Liệu Tích Hợp OpenClaw - Báo Giá Mới & Phiếu Đặt Hàng Khách Hàng

Tài liệu này hướng dẫn chi tiết cách tích hợp **OpenClaw Agent** với hệ thống **Turbo Diesel API** để thực hiện tự động hóa 2 tính năng cốt lõi:
1. **Xuất Báo Giá Excel Theo Mẫu Chuẩn Mới** (`BG20260731_Anh_Nguyen_MienNam_2.xlsx`)
2. **Xuất Phiếu Đặt Hàng Khách Hàng** (`PHIEU_DAT_HANG_KHÁCH HÀNG.xlsx`)

---

## 1. Kiến Trúc & Cấu Hình Kết Nối

```text
  ┌─────────────────┐       HTTP / REST API        ┌──────────────────────┐
  │ OpenClaw Agent  │ ───────────────────────────> │  Django REST Server  │
  │ (Custom Tools)  │ <─────────────────────────── │ (Turbo Diesel Backend)│
  └─────────────────┘   JWT Bearer Authentication  └──────────────────────┘
```

- **Base URL Dev**: `http://localhost:8000/api/v1`
- **Base URL Production**: `https://luanmienam.devoverflow.xyz/api/v1`
- **Header xác thực**:
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

---

## 2. Tính Năng 1: Xuất Báo Giá Excel Mẫu Mới (New Quotation Template)

### 2.1. Mô tả & Quy cách Báo giá
- Sử dụng template gốc: `templates/bao_gia_template_clean.xlsx` (đã được nâng cấp theo chuẩn mẫu mới `BG20260731_Anh_Nguyen_MienNam_2.xlsx`).
- **Cấu trúc bảng báo giá (7 cột)**:
  - `Col A`: STT
  - `Col B`: TÊN HÀNG HÓA (`ten_hang` hoặc `model_turbo`)
  - `Col C`: MÃ HH (`ma_vt`)
  - `Col D`: ĐVT (`dvt`)
  - `Col E`: SL (Số lượng)
  - `Col F`: ĐƠN GIÁ (`#,##0`)
  - `Col G`: THÀNH TIỀN (`=F{row}*E{row}`)
- **Công thức tự động tại footer**:
  - `Cộng tiền hàng (chưa VAT)`: `=ROUND(G_TONG_CONG/1.08,0)`
  - `Thuế GTGT 8%`: `=G_TONG_CONG - G_CHUA_VAT`
  - `TỔNG CỘNG (đã có VAT)`: `=SUM(G15:G{last_row})`
  - `Bằng chữ`: Đọc tự động số tiền bằng chữ (ví dụ: *Bằng chữ: Mười triệu năm trăm tám mươi nghìn đồng chẵn./.*).

### 2.2. Endpoints API Báo Giá

#### 1) Xem trước PDF Báo Giá (Preview PDF)
```http
POST /api/v1/quotations/preview-pdf/
```
- **Request Body**:
  ```json
  {
    "customer_id": 15,
    "product_ids": [101, 102],
    "items_custom": [
      { "product_id": 101, "custom_price": 5000000, "price_label": "GIÁ ĐẠI LÝ", "quantity": 1 },
      { "product_id": 102, "custom_price": 700000, "price_label": "GIÁ ĐẠI LÝ", "quantity": 1 }
    ]
  }
  ```
- **Response**: Binary `application/pdf` (Hiển thị preview trực tiếp cho người dùng).

#### 2) Tải File Excel Báo Giá
```http
POST /api/v1/quotations/export-excel/
```
- **Request Body**: Tương tự preview-pdf.
- **Response**: Binary `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` chứa file `.xlsx`.
- **Response Headers**:
  - `Content-Disposition: attachment; filename="BG2026073101_Anh_Nguyen.xlsx"`
  - `X-Quotation-Id`: ID của bản ghi báo giá đã lưu.
  - `X-Quote-Number`: Mã báo giá (ví dụ: `BG20260731094500-02`).

#### 3) Tải File PDF Báo Giá
```http
POST /api/v1/quotations/export-pdf/
```
- **Request Body**: Tương tự export-excel.
- **Response**: Binary `application/pdf`.

---

## 3. Tính Năng 2: Xuất Phiếu Đặt Hàng Khách Hàng (Customer Order Sheet)

### 3.1. Mô tả & Quy cách Phiếu Đặt Hàng
- Sử dụng template gốc: `templates/PHIEU_DAT_HANG_KHÁCH HÀNG.xlsx`.
- **Cấu trúc bảng đặt hàng (9 cột chính + cột K hỗ trợ Zalo)**:
  - `Col A`: STT
  - `Col B`: NGÀY ĐẶT (`dd/mm/yyyy`)
  - `Col C`: MÃ HH (`ma_vt`)
  - `Col D`: TÊN SẢN PHẨM (`ten_hang`)
  - `Col E`: ĐVT (`dvt`)
  - `Col F`: SỐ LƯỢNG
  - `Col G`: ĐƠN GIÁ
  - `Col H`: THÀNH TIỀN (`=IF(AND(F<>"",G<>""),F*G,"")`)
  - `Col I`: GHI CHÚ
  - `Col K`: **Công thức sinh tin nhắn Zalo tự động** cho từng sản phẩm:
    - `=IF(D9="","",A9&". "&D9&IF(E9=""," "," ("&E9&") ")&"| SL "&IF(F9="","?",SUBSTITUTE(TEXT(F9,"#,##0"),",","."))&...`
- **Công thức tự động tại dòng Tổng tiền**:
  - `TỔNG TIỀN HÀNG`: `=SUM(H9:H{last_row})`
  - `VAT 8%`: `=H_TONG_TIEN*8%`
  - `TỔNG THANH TOÁN`: `=H_TONG_TIEN + H_VAT`

### 3.2. Endpoints API Phiếu Đặt Hàng

#### 1) Xem trước PDF Phiếu Đặt Hàng
```http
POST /api/v1/orders/preview-pdf/
```
- **Request Body**:
  ```json
  {
    "customer_id": 15,
    "product_ids": [101, 102],
    "nhan_vien": "Nguyễn Văn Luân",
    "items_custom": [
      { "product_id": 101, "custom_price": 5000000, "price_label": "GIÁ ĐẠI LÝ", "quantity": 1 },
      { "product_id": 102, "custom_price": 700000, "price_label": "GIÁ ĐẠI LÝ", "quantity": 1 }
    ]
  }
  ```
- **Response**: Binary `application/pdf`.

#### 2) Tải File Excel Phiếu Đặt Hàng
```http
POST /api/v1/orders/export-excel/
```
- **Response**: Binary `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- **Response Headers**:
  - `Content-Disposition: attachment; filename="DH2026073101_Gara_Hoang_Long.xlsx"`

#### 3) Tải File PDF Phiếu Đặt Hàng
```http
POST /api/v1/orders/export-pdf/
```
- **Response**: Binary `application/pdf`.

---

## 4. Khai Báo OpenClaw Custom Tools (Tool Schema JSON)

OpenClaw có thể dùng các schema tool dưới đây để đăng ký chức năng tạo Báo Giá và Phiếu Đặt Hàng:

```json
[
  {
    "name": "export_quotation_excel",
    "description": "Tự động tạo và tải xuống file Excel Báo Giá mẫu mới cho khách hàng.",
    "parameters": {
      "type": "object",
      "properties": {
        "customer_id": { "type": "integer", "description": "ID khách hàng" },
        "product_ids": {
          "type": "array",
          "items": { "type": "integer" },
          "description": "Danh sách ID sản phẩm"
        },
        "items_custom": {
          "type": "array",
          "description": "Danh sách giá tùy chỉnh nếu có",
          "items": {
            "type": "object",
            "properties": {
              "product_id": { "type": "integer" },
              "custom_price": { "type": "number" },
              "price_label": { "type": "string" },
              "quantity": { "type": "integer" }
            }
          }
        }
      },
      "required": ["customer_id", "product_ids"]
    }
  },
  {
    "name": "export_order_excel",
    "description": "Tự động tạo và tải xuống file Excel Phiếu Đặt Hàng Khách Hàng.",
    "parameters": {
      "type": "object",
      "properties": {
        "customer_id": { "type": "integer", "description": "ID khách hàng" },
        "product_ids": {
          "type": "array",
          "items": { "type": "integer" },
          "description": "Danh sách ID sản phẩm"
        },
        "nhan_vien": { "type": "string", "description": "Tên người lập phiếu" },
        "items_custom": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "product_id": { "type": "integer" },
              "custom_price": { "type": "number" },
              "price_label": { "type": "string" },
              "quantity": { "type": "integer" }
            }
          }
        }
      },
      "required": ["customer_id", "product_ids"]
    }
  }
]
```

---

## 5. Hướng Dẫn System Prompt Cho OpenClaw Agent

Có thể sao chép đoạn Prompt mẫu sau vào System Instruction của OpenClaw Agent:

```text
Bạn là Trợ Lý Báo Giá & Đặt Hàng Phụ Tùng Turbo Diesel.

KHI NGƯỜI DÙNG YÊU CẦU:
1. "Tạo báo giá" / "Xuất báo giá":
   - Tìm khách hàng qua /api/v1/customers/search/?q=...
   - Tìm mã sản phẩm qua /api/v1/products/?q=...
   - Gọi POST /api/v1/quotations/preview-pdf/ để gửi preview cho người dùng kiểm tra.
   - Sau khi người dùng chốt, gọi POST /api/v1/quotations/export-excel/ hoặc /export-pdf/.

2. "Tạo phiếu đặt hàng" / "Xuất đơn hàng":
   - Tìm khách hàng & sản phẩm tương tự.
   - Gọi POST /api/v1/orders/preview-pdf/ để xem trước đơn hàng.
   - Gọi POST /api/v1/orders/export-excel/ để lấy file Phiếu Đặt Hàng Khách Hàng chứa tin nhắn Zalo tự động.
```
