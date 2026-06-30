# KẾ HOẠCH & THIẾT KẾ: BÁO CÁO THỐNG KÊ DOANH SỐ & THỰC NHẬN CỦA NHÂN VIÊN

Tài liệu này mô tả chi tiết phương án thiết kế tính năng báo cáo hiệu suất bán hàng cho từng nhân viên theo các chu kỳ: **Ngày, Tuần, Tháng**. 

Tính năng này giúp theo dõi: Số lượng báo giá gửi đi, số lượng đơn chốt thành công, số lượng báo giá bị từ chối, tổng doanh số mang lại và phần **doanh số thực nhận (hoa hồng / lợi nhuận gộp)** của nhân viên.

---

## I. Phân Tích Cơ Sở Dữ Liệu Hiện Tại

Hệ thống cơ sở dữ liệu hiện tại trong tệp `products/models.py` đã có sẵn các trường dữ liệu nền tảng rất thuận lợi để triển khai tính năng này:

1. **Trạng thái báo giá (`Quotation.status`)**:
   * Đang sử dụng 3 trạng thái:
     * `DA_GUI` (Đã gửi báo giá cho khách).
     * `DA_CHOT` (Khách đã đồng ý chốt đơn thành công).
     * `THUA` (Khách từ chối báo giá hoặc thất bại).
2. **Nhân viên xử lý (`Quotation.nhan_vien`)**:
   * Lưu tên hoặc mã định danh của nhân viên tạo báo giá.
3. **Giá vốn và Giá bán (`Product` & `QuotationItem`)**:
   * Từng sản phẩm trong bảng `Product` đều có trường `gia_von` (giá nhập kho).
   * Từng chi tiết dòng báo giá `QuotationItem` có `don_gia` (giá bán thực tế trong đơn), `so_luong`, và liên kết tới sản phẩm gốc.

---

## II. Phương Pháp Tính Toán Chỉ Số (Logic Nghiệp Vụ)

Khi nhân viên truy vấn thống kê theo khoảng thời gian (Ngày / Tuần / Tháng):

### 1. Số lượng báo giá gửi đi (Quotation Sent)
* **Công thức**: Đếm tổng số bản ghi `Quotation` có ngày tạo (`created_at`) nằm trong khoảng thời gian truy vấn của nhân viên đó.
* **Mã ORM Django gợi ý**: `Quotation.objects.filter(nhan_vien=agent, created_at__range=(start, end)).count()`

### 2. Số lần chốt đơn thành công (Successful Orders)
* **Công thức**: Đếm các báo giá có trạng thái là `DA_CHOT`.
* **Mã ORM Django gợi ý**: `Quotation.objects.filter(nhan_vien=agent, status='DA_CHOT', created_at__range=(start, end)).count()`

### 3. Số lần từ chối (Rejected Quotes)
* **Công thức**: Đếm các báo giá có trạng thái là `THUA`.
* **Mã ORM Django gợi ý**: `Quotation.objects.filter(nhan_vien=agent, status='THUA', created_at__range=(start, end)).count()`

### 4. Doanh số mang lại (Gross Revenue)
* **Công thức**: Tổng giá trị các báo giá đã chốt thành công trong kỳ.
* **Mã ORM Django gợi ý**: `Quotation.objects.filter(nhan_vien=agent, status='DA_CHOT', created_at__range=(start, end)).aggregate(Sum('tong_cong'))`

### 5. Doanh số Thực Nhận của nhân viên (Net Income / Commission)
Để tính phần "Thực nhận", chúng ta đề xuất 2 phương án cấu hình tùy theo mô hình kinh doanh của công ty:
* **Phương án A (Tính theo Lợi nhuận gộp)**:
  * *Ý tưởng*: Thực nhận bằng phần chênh lệch giữa Giá bán thực tế và Giá vốn của các sản phẩm trong các đơn hàng đã chốt thành công.
  * *Công thức*: 
    $$\text{Thực nhận} = \sum \Big( (\text{Đơn giá bán} - \text{Giá vốn}) \times \text{Số lượng} \Big)$$
    *(Chỉ tính trên các đơn hàng có trạng thái `DA_CHOT`)*
* **Phương án B (Tính theo Tỷ lệ Hoa hồng cố định)**:
  * *Ý tưởng*: Nhân viên được hưởng một tỷ lệ phần trăm (ví dụ: $2\%$, $5\%$, $10\%$) trên tổng doanh số chốt thành công của họ.
  * *Công thức*: 
    $$\text{Thực nhận} = \text{Tổng doanh số chốt} \times \text{Tỷ lệ Hoa hồng cấu hình}$$

---

## III. Thiết Kế Giao Diện Người Dùng (Frontend UI/UX)

Tính năng này sẽ được tích hợp làm một tab **"Báo Cáo Hiệu Suất" (Sales Dashboard)** ngay trên trang chủ hoặc trang quản lý cá nhân:

### 1. Bộ lọc thời gian (Time Range Selector)
* Một nhóm nút bấm chuyển đổi nhanh (Segmented Control): **Hôm nay** | **Tuần này** | **Tháng này** | **Tùy chọn ngày** (Sử dụng Date Range Picker).

### 2. Các thẻ chỉ số chính (Metric Cards)
Hiển thị lung linh bằng ShadCN UI Card kết hợp các icon trực quan của `lucide-react`:
* **Thẻ 1: Tổng Báo Giá Đã Gửi** (Icon: `FileText` màu xanh dương)
  * Số lượng báo giá gửi đi + Phần trăm tăng/giảm so với chu kỳ trước.
* **Thẻ 3: Tổng Doanh Số** (Icon: `DollarSign` màu vàng kim)
  * Hiển thị số tiền doanh số đã chốt (Ví dụ: `150,000,000 ₫`).
* **Thẻ 4: Thực Nhận Của Bạn** (Icon: `TrendingUp` màu cam/đỏ)
  * Số tiền hoa hồng hoặc lợi nhuận thực nhận của nhân viên đó (Ví dụ: `15,000,000 ₫`).

### 3. Biểu đồ đường xu hướng (Performance Charts)
* Sử dụng thư viện biểu đồ nhẹ nhàng (như `Recharts` hoặc `Chart.js` có sẵn trong React):
  * Trục hoành ($X$): Các ngày trong tuần/tháng.
  * Trục tung ($Y$): Giá trị doanh số hoặc số lượng báo giá tương ứng.
  * Đường màu xanh lá thể hiện doanh số mang lại, đường màu vàng/cam thể hiện phần thực nhận để nhân viên nhìn thấy sự tăng trưởng trực quan.

---

## IV. Bản Phác Thảo API Response Gợi Ý (JSON Backend trả về)

Khi Frontend gửi yêu cầu tới `/api/v1/quotations/agent-stats/?period=month`, Backend sẽ trả về cấu trúc JSON mẫu như sau:

```json
{
  "agent_name": "Luan Mien Nam",
  "period": "month",
  "date_range": {
    "start": "2026-06-01",
    "end": "2026-06-30"
  },
  "metrics": {
    "total_sent": 45,
    "successful_orders": 30,
    "rejected_orders": 5,
    "pending_orders": 10,
    "conversion_rate": 85.7,
    "gross_revenue": 245000000,
    "net_commission": 24500000
  },
  "chart_data": [
    { "date": "05/06", "sent": 10, "closed": 7, "revenue": 56000000, "commission": 5600000 },
    { "date": "12/06", "sent": 12, "closed": 8, "revenue": 68000000, "commission": 6800000 },
    { "date": "19/06", "sent": 15, "closed": 10, "revenue": 81000000, "commission": 8100000 },
    { "date": "26/06", "sent": 8, "closed": 5, "revenue": 40000000, "commission": 4000000 }
  ]
}
```

Tài liệu này phác thảo toàn bộ luồng hoạt động từ DB, Logic nghiệp vụ, đến Giao diện và API để bạn xem xét trước khi có quyết định triển khai chính thức.
