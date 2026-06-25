# Turbo Diesel - Roadmap tính năng và tích hợp OpenClaw

Tài liệu này tổng hợp các tính năng hiện có, các tính năng nên mở rộng, và hướng tích hợp API để OpenClaw có thể tự động hóa quy trình báo giá cho khách hàng.

## 1. Mục tiêu

Hệ thống hiện tại đang phục vụ quy trình:

- Tìm sản phẩm phụ tùng động cơ.
- Chọn sản phẩm cần báo giá.
- Xuất Excel và lưu báo giá.
- Theo dõi lịch sử báo giá bằng lịch ngày/tuần/tháng/quý.
- Thống kê báo giá trên dashboard.

Hướng mở rộng chính là biến hệ thống thành một "quotation automation hub": nhận nhu cầu khách, gợi ý sản phẩm, tạo báo giá, lưu lịch sử, theo dõi trạng thái, và tự động nhắc việc/chăm sóc khách.

## 2. Tính năng hiện có

### 2.1. Quản lý sản phẩm

- Danh sách sản phẩm có phân trang.
- Tìm kiếm theo mã vật tư, model, OEM, tên hàng.
- Lọc theo loại sản phẩm, hãng máy, thương hiệu.
- Hiển thị ảnh sản phẩm từ đường dẫn media.
- Trang chi tiết sản phẩm.
- Thống kê tổng số sản phẩm.

API liên quan:

| Mục đích | Method | Endpoint |
| --- | --- | --- |
| Danh sách/tìm kiếm sản phẩm | GET | `/api/v1/products/` |
| Chi tiết sản phẩm | GET | `/api/v1/products/<id>/` |
| Thống kê sản phẩm | GET | `/api/v1/products/stats/` |
| Loại sản phẩm | GET | `/api/v1/categories/` |
| Hãng máy | GET | `/api/v1/hang-may/` |
| Hãng sản xuất | GET | `/api/v1/hang-sx/` |
| Thương hiệu | GET | `/api/v1/thuong-hieu/` |

### 2.2. Báo giá

- Tick chọn sản phẩm để tạo báo giá.
- Xuất Excel và lưu thông tin báo giá.
- Không hiển thị chức năng PDF vì chất lượng xuất PDF chưa ổn định.
- Lưu báo giá gồm khách hàng, số điện thoại, giá áp dụng, sản phẩm, số lượng, thành tiền.
- Cập nhật trạng thái báo giá: đã gửi, đã chốt, thua.
- Thêm ghi chú và nhân viên phụ trách.

API liên quan:

| Mục đích | Method | Endpoint |
| --- | --- | --- |
| Xem trước báo giá | POST | `/api/v1/quotations/preview/` |
| Xuất CSV | POST | `/api/v1/quotations/export-csv/` |
| Xuất Excel | POST | `/api/v1/quotations/export-excel/` |
| Lưu báo giá | POST | `/api/v1/quotations/save/` |
| Cập nhật báo giá | PATCH | `/api/v1/quotations/<id>/update/` |

### 2.3. Lịch báo giá

- Trang `/bao-gia` hiển thị báo giá theo lịch.
- Có chế độ xem theo ngày, tuần, tháng, quý.
- Mặc định xem theo tuần, bắt đầu từ thứ 2.
- Có thống kê nhanh: tổng báo giá, khách hàng, tổng giá trị, tỉ lệ chốt.
- Click vào báo giá trên lịch để xem chi tiết.
- Scroll lịch chỉ kích hoạt khi màn hình nhỏ hoặc chiều cao màn hình không đủ.

API liên quan:

| Mục đích | Method | Endpoint |
| --- | --- | --- |
| Báo giá hôm nay | GET | `/api/v1/quotations/today/` |
| Thống kê hôm nay | GET | `/api/v1/quotations/today/stats/` |
| Lịch sử báo giá theo khoảng ngày | GET | `/api/v1/quotations/history/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` |
| Thống kê theo khoảng ngày | GET | `/api/v1/quotations/history/stats/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` |

### 2.4. Dashboard thống kê

- Trang `/bao-gia/dashboard`.
- Thống kê theo tháng này, quý này, năm nay.
- Hiển thị tổng báo giá, khách hàng, tổng giá trị, tỉ lệ chốt.
- Hiển thị danh sách báo giá gần đây trong quý.

### 2.5. Khách hàng

- Danh sách khách hàng.
- Tìm kiếm khách hàng.
- Chi tiết khách hàng.

API liên quan:

| Mục đích | Method | Endpoint |
| --- | --- | --- |
| Danh sách khách hàng | GET | `/api/v1/customers/` |
| Tìm kiếm khách hàng | GET | `/api/v1/customers/search/` |
| Chi tiết khách hàng | GET | `/api/v1/customers/<id>/` |

## 3. Tính năng nên mở rộng

### 3.1. Mở rộng lịch báo giá

Nên thêm:

- Bộ lọc trong lịch theo nhân viên, khách hàng, trạng thái.
- Kéo thả đổi ngày follow-up cho báo giá.
- Gắn ngày hẹn gọi lại cho từng báo giá.
- Nhắc việc báo giá chưa được chốt sau N ngày.
- Chế độ xem "cần xử lý hôm nay".

Giá trị cho khách:

- Dễ biết việc nào cần chăm sóc tiếp.
- Giảm thất lạc báo giá.
- Theo dõi KPI theo từng nhân viên.

### 3.2. Pipeline bán hàng

Nên thêm trang pipeline gồm các cột:

- Mới tạo.
- Đã gửi.
- Đang thương lượng.
- Đã chốt.
- Thua.

Mỗi báo giá có thể kéo thả qua cột trạng thái. Khi đổi trạng thái thì lưu log.

API cần thêm:

| Mục đích | Method | Endpoint gợi ý |
| --- | --- | --- |
| Đổi trạng thái nhanh | PATCH | `/api/v1/quotations/<id>/status/` |
| Lấy pipeline | GET | `/api/v1/quotations/pipeline/` |
| Log trạng thái | GET | `/api/v1/quotations/<id>/timeline/` |

### 3.3. Tự động gợi ý sản phẩm

OpenClaw có thể nhận tin nhắn khách và tách các thông tin:

- Loại phụ tùng.
- Model máy.
- OEM.
- Hãng máy.
- Kích thước.
- Từ khóa mô tả lỗi.

Sau đó gọi API tìm sản phẩm và trả về danh sách gợi ý cho nhân viên xác nhận.

API hiện có có thể dùng:

- `GET /api/v1/products/?search=...`
- `GET /api/v1/categories/`
- `GET /api/v1/hang-may/`
- `GET /api/v1/thuong-hieu/`

API nên thêm:

| Mục đích | Method | Endpoint gợi ý |
| --- | --- | --- |
| Tìm sản phẩm nâng cao | POST | `/api/v1/products/match/` |
| Gợi ý sản phẩm từ text khách | POST | `/api/v1/ai/product-suggestions/` |

Payload gợi ý:

```json
{
  "message": "Khách cần két nước Yanmar 75, có ảnh kèm theo",
  "customer_phone": "0905123456",
  "attachments": []
}
```

Response gợi ý:

```json
{
  "intent": "bao_gia",
  "keywords": ["két nước", "Yanmar", "75"],
  "suggested_products": [
    {
      "id": 123,
      "ma_vt": "HH20534",
      "ten_hang": "Két nước YANMAR 75 - YANMAR",
      "confidence": 0.91
    }
  ]
}
```

### 3.4. Tạo báo giá tự động

OpenClaw có thể tạo báo giá theo flow:

1. Nhận tin nhắn khách.
2. Tìm hoặc tạo khách hàng.
3. Gợi ý sản phẩm.
4. Cho nhân viên xác nhận sản phẩm/số lượng/giá.
5. Gọi API xuất Excel.
6. Gọi API lưu báo giá.
7. Gửi file báo giá cho khách qua kênh tích hợp.

API hiện có có thể dùng:

- `POST /api/v1/quotations/export-excel/`
- `POST /api/v1/quotations/save/`
- `GET /api/v1/customers/search/`

API nên thêm:

| Mục đích | Method | Endpoint gợi ý |
| --- | --- | --- |
| Tạo khách hàng | POST | `/api/v1/customers/` |
| Tạo báo giá trọn gói | POST | `/api/v1/quotations/create-and-export/` |
| Gửi báo giá qua Zalo/Email | POST | `/api/v1/quotations/<id>/send/` |

### 3.5. Tích hợp Zalo/Facebook/Website chat

Nên tạo module "inbox" gồm:

- Tin nhắn từ Zalo OA.
- Tin nhắn Facebook Page.
- Form website.
- Lịch sử hỏi đáp theo khách.
- Gắn hội thoại với báo giá.

API nên thêm:

| Mục đích | Method | Endpoint gợi ý |
| --- | --- | --- |
| Nhận webhook tin nhắn | POST | `/api/v1/webhooks/messages/` |
| Danh sách hội thoại | GET | `/api/v1/conversations/` |
| Chi tiết hội thoại | GET | `/api/v1/conversations/<id>/` |
| Gắn báo giá vào hội thoại | POST | `/api/v1/conversations/<id>/quotations/` |

### 3.6. Chăm sóc sau báo giá

Nên thêm tự động:

- Nếu báo giá đã gửi qua 1 ngày: nhắc nhân viên gọi lại.
- Nếu đã chốt: tạo việc giao hàng/kiểm tra thanh toán.
- Nếu thua: hỏi lý do thua và lưu vào báo cáo.
- Tạo danh sách khách cần chăm sóc mỗi ngày.

API nên thêm:

| Mục đích | Method | Endpoint gợi ý |
| --- | --- | --- |
| Task chăm sóc | GET/POST | `/api/v1/tasks/` |
| Danh sách việc hôm nay | GET | `/api/v1/tasks/today/` |
| Hoàn thành task | PATCH | `/api/v1/tasks/<id>/complete/` |
| Lý do thua | POST | `/api/v1/quotations/<id>/lost-reason/` |

### 3.7. Báo cáo nâng cao

Nên thêm:

- Doanh thu theo ngày/tuần/tháng/quý.
- Tỉ lệ chốt theo nhân viên.
- Sản phẩm được báo giá nhiều nhất.
- Khách hàng có giá trị cao.
- Lý do thua phổ biến.
- Thời gian trung bình từ báo giá đến chốt.

API nên thêm:

| Mục đích | Method | Endpoint gợi ý |
| --- | --- | --- |
| Báo cáo tổng quan | GET | `/api/v1/reports/overview/` |
| Báo cáo nhân viên | GET | `/api/v1/reports/staff/` |
| Báo cáo sản phẩm | GET | `/api/v1/reports/products/` |
| Báo cáo khách hàng | GET | `/api/v1/reports/customers/` |

## 4. Đề xuất kiến trúc tích hợp OpenClaw

### 4.1. OpenClaw đóng vai trò automation agent

OpenClaw nên dùng như một lớp điều phối:

- Đọc tin nhắn và file ảnh khách gửi.
- Phân tích nhu cầu.
- Gọi API sản phẩm/khách hàng/báo giá.
- Trả về gợi ý cho nhân viên.
- Tự động thực hiện các bước đã được phê duyệt.

Không nên để OpenClaw sửa trực tiếp database. Nên thông qua API có xác thực để đảm bảo log và phân quyền rõ ràng.

### 4.2. Các action OpenClaw nên có

| Action | Mô tả | API cần gọi |
| --- | --- | --- |
| `search_products` | Tìm sản phẩm theo text/OEM/model | `/api/v1/products/` |
| `get_product_detail` | Lấy chi tiết sản phẩm | `/api/v1/products/<id>/` |
| `search_customer` | Tìm khách theo tên/SĐT | `/api/v1/customers/search/` |
| `create_quote_excel` | Tạo file Excel báo giá | `/api/v1/quotations/export-excel/` |
| `save_quote` | Lưu báo giá vào hệ thống | `/api/v1/quotations/save/` |
| `update_quote_status` | Đổi trạng thái báo giá | `/api/v1/quotations/<id>/update/` |
| `get_quote_stats` | Lấy thống kê | `/api/v1/quotations/history/stats/` |

### 4.3. Workflow tự động mẫu

#### Workflow 1: Khách hỏi giá phụ tùng

1. Khách gửi: "Có két nước Yanmar 75 không?"
2. OpenClaw gọi `search_products`.
3. OpenClaw trả về 3 sản phẩm phù hợp nhất.
4. Nhân viên chọn sản phẩm và số lượng.
5. OpenClaw gọi `create_quote_excel`.
6. OpenClaw gọi `save_quote`.
7. Hệ thống tạo lịch follow-up vào ngày hôm sau.

#### Workflow 2: Báo giá chưa chốt

1. Mỗi 8h sáng, OpenClaw gọi API lấy báo giá `DA_GUI` quá 1 ngày.
2. Tạo danh sách cần gọi lại.
3. Nếu nhân viên cập nhật `DA_CHOT`, hệ thống ghi nhận doanh thu.
4. Nếu cập nhật `THUA`, OpenClaw hỏi lý do thua để lưu báo cáo.

#### Workflow 3: Dashboard điều hành

1. OpenClaw lấy thống kê theo ngày/tuần/tháng/quý.
2. Gửi tóm tắt cho quản lý:
   - Tổng báo giá.
   - Tổng giá trị.
   - Tỉ lệ chốt.
   - Top sản phẩm được hỏi.
   - Báo giá cần chăm sóc.

## 5. Dữ liệu nên bổ sung vào database

### 5.1. Quotation

Nên bổ sung trường:

- `follow_up_at`: ngày cần chăm sóc lại.
- `sent_at`: ngày gửi báo giá cho khách.
- `closed_at`: ngày chốt.
- `lost_reason`: lý do thua.
- `source`: nguồn khách, ví dụ Zalo, Facebook, Website, gọi điện.
- `conversation_id`: liên kết với hội thoại.

### 5.2. Customer

Nên bổ sung trường:

- `zalo_id`
- `facebook_id`
- `email`
- `address`
- `company_name`
- `tax_code`
- `last_contact_at`
- `customer_tags`

### 5.3. Activity log

Nên có bảng log riêng:

- Ai tạo báo giá.
- Ai sửa trạng thái.
- Lúc nào gửi báo giá.
- OpenClaw đã tự động làm gì.
- Kết quả thành công/thất bại.

## 6. Bảo mật và phân quyền

Cần đảm bảo:

- OpenClaw dùng API token riêng, không dùng tài khoản admin.
- Mỗi action quan trọng phải ghi log.
- Các action gửi báo giá/sửa trạng thái nên có cơ chế xác nhận.
- Giới hạn rate limit cho webhook công khai.
- File export nên có thời hạn truy cập nếu gửi link cho khách.

## 7. Ưu tiên triển khai

### Giai đoạn 1: Chuẩn hóa API cho automation

- Thêm endpoint tạo khách hàng.
- Thêm endpoint tạo báo giá trọn gói.
- Thêm endpoint danh sách báo giá cần follow-up.
- Thêm activity log.

### Giai đoạn 2: OpenClaw hỗ trợ nhân viên

- Tìm sản phẩm từ tin nhắn khách.
- Gợi ý sản phẩm phù hợp.
- Tạo Excel báo giá từ giỏ hàng đã xác nhận.
- Lưu báo giá và tạo lịch follow-up.

### Giai đoạn 3: Tự động chăm sóc khách

- Nhắc báo giá chưa chốt.
- Báo cáo hằng ngày cho quản lý.
- Lưu lý do thua.
- Thống kê sản phẩm/khách hàng/nhân viên.

### Giai đoạn 4: Tích hợp kênh bán hàng

- Zalo OA.
- Facebook Page.
- Website chat.
- Email gửi báo giá.

## 8. Checklist API cần ưu tiên thêm

- [ ] `POST /api/v1/customers/`
- [ ] `POST /api/v1/products/match/`
- [ ] `POST /api/v1/quotations/create-and-export/`
- [ ] `GET /api/v1/quotations/follow-ups/`
- [ ] `PATCH /api/v1/quotations/<id>/status/`
- [ ] `GET /api/v1/quotations/<id>/timeline/`
- [ ] `POST /api/v1/webhooks/messages/`
- [ ] `GET /api/v1/reports/overview/`
- [ ] `GET /api/v1/tasks/today/`
- [ ] `PATCH /api/v1/tasks/<id>/complete/`

## 9. Ghi chú kỹ thuật

- Frontend đang dùng React, Vite, TanStack Query, FullCalendar.
- Backend dùng Django REST Framework.
- Export báo giá hiện nên ưu tiên Excel.
- PDF đã tắt trên UI vì chất lượng convert chưa ổn định.
- Media sản phẩm cần được serve qua `/media/` trên nginx.
- Khi chạy Docker không xóa volume media.

