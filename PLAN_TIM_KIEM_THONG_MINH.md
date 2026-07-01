# Kế hoạch nâng cấp: Tìm kiếm thông minh đa từ khóa (Smart Search)

## 1. Mô tả và Yêu cầu

### Vấn đề hiện tại
- Hiện tại, chức năng tìm kiếm sản phẩm đang dùng bộ lọc `__icontains` khớp chính xác toàn bộ chuỗi ký tự người dùng nhập vào.
- Nếu người dùng nhập nhiều từ khóa cách nhau bởi khoảng trắng hoặc dấu phẩy (ví dụ: `6d125 xy` hoặc `6d125 , pis`), hệ thống sẽ tìm kiếm chính xác cụm từ `"6d125 xy"` hoặc `"6d125 , pis"`. Do không có trường thông tin nào chứa cụm từ này, kết quả trả về sẽ là **0 sản phẩm**.

### Yêu cầu nâng cấp
- Hỗ trợ tìm kiếm thông minh đa từ khóa (AND giữa các từ khóa).
- Cho phép phân tách chuỗi tìm kiếm bằng khoảng trắng hoặc dấu phẩy `,` thành các từ khóa riêng lẻ.
- Mỗi sản phẩm được trả về phải thỏa mãn **tất cả** các từ khóa được tìm kiếm (Toán tử AND).
- Mỗi từ khóa đơn lẻ sẽ khớp (OR) với bất kỳ trường thông tin nào của sản phẩm bao gồm:
  - Mã vật tư (`ma_vt`)
  - Tên hàng / model (`ten_hang`, `model_turbo`)
  - Mã động cơ (`ma_dong_co`)
  - OEM Part Number (`oem_part_no`)
  - Đặc điểm, Ứng dụng, Part Number gốc (`dac_diem`, `ung_dung`, `parno`)
  - **Mới**: Tên danh mục liên kết (`category__ten`)
  - **Mới**: Tên hãng máy liên kết (`hang_may__ten`)
  - **Mới**: Tên hãng sản xuất liên kết (`hang_sx__ten`)
  - **Mới**: Tên thương hiệu liên kết (`thuong_hieu__ten`)

---

## 2. Các thay đổi đề xuất

### Backend

#### [MODIFY] [products/filters.py](file:///d:/Du_An_Bao_Giao/products/filters.py)
- Import thư viện `re` ở đầu file.
- Sửa đổi phương thức `filter_search` để:
  1. Phân tách chuỗi tìm kiếm `value` bằng biểu thức chính quy `r'[, \s]+'` thành danh sách các từ khóa đơn lẻ.
  2. Duyệt qua từng từ khóa, thực hiện filter nối tiếp (tương đương phép toán `AND` trong SQL).
  3. Mở rộng khớp từ khóa với các bảng liên kết `category__ten`, `hang_may__ten`, `hang_sx__ten`, `thuong_hieu__ten`.

#### [MODIFY] [products/tests.py](file:///d:/Du_An_Bao_Giao/products/tests.py)
- Viết các test case thừa kế `TestCase` của Django:
  - Tạo dữ liệu giả lập (`Category`, `HangMay`, `Product`).
  - Gọi API hoặc gọi `ProductFilter` trực tiếp để kiểm tra:
    - Tìm kiếm một từ khóa đơn lẻ (ví dụ: `6d125`).
    - Tìm kiếm đa từ khóa cách nhau bởi khoảng trắng (ví dụ: `6d125 xy`).
    - Tìm kiếm đa từ khóa cách nhau bởi dấu phẩy (ví dụ: `6d125, pis`).
    - Đảm bảo tìm kiếm không phân biệt chữ hoa/thường.

---

## 3. Kế hoạch xác minh (Verification Plan)

### Kiểm tra tự động
- Chạy toàn bộ Unit Tests của Backend:
  ```bash
  venv/Scripts/python.exe manage.py test products
  ```
- Chạy lệnh build frontend: `npm run build` trong thư mục `frontend` để kiểm tra có lỗi phát sinh không.

### Kiểm tra thủ công
1. Vào trang tìm kiếm sản phẩm.
2. Nhập từ khóa: `6D125 xy` -> Hệ thống hiển thị đúng các sản phẩm thuộc động cơ `6D125` và thuộc danh mục `Xy lanh`.
3. Nhập từ khóa: `6D125, pis` -> Hệ thống hiển thị đúng các sản phẩm thuộc động cơ `6D125` và thuộc danh mục `Piston`.
4. Nhập từ khóa: `komatsu turbo` -> Hệ thống hiển thị đúng các sản phẩm thuộc hãng máy `KOMATSU` và thuộc loại/danh mục `Turbo`.
