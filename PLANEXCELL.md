Kế hoạch nâng cấp: Xuất PDF trực tiếp từ Excel bằng LibreOffice
Kế hoạch này loại bỏ hoàn toàn template PDF dựng thủ công ở Frontend và thay thế bằng tính năng chuyển đổi trực tiếp file Excel báo giá sang PDF trên Backend bằng LibreOffice. Điều này giúp file PDF xuất ra có giao diện, định dạng, căn lề và công thức trùng khớp 100% với file Excel.

User Review Required
IMPORTANT

Cài đặt LibreOffice trên máy chủ / VPS:
Tại máy cá nhân (Windows): Để kiểm tra thử tính năng, anh cần tải và cài đặt LibreOffice từ trang chủ: https://www.libreoffice.org/.
Tại máy chủ Production (Linux VPS): Cài đặt LibreOffice qua lệnh: sudo apt-get update && sudo apt-get install -y libreoffice.
Nếu máy chủ chưa được cài đặt LibreOffice, hệ thống sẽ trả về lỗi thông báo thân thiện yêu cầu cài đặt thay vì crash.
Xóa file template PDF cũ ở Frontend:
File frontend/src/pages/search/components/quotation-pdf.tsx sẽ được loại bỏ vì toàn bộ việc sinh PDF hiện đã do Backend đảm nhận bằng cách convert từ file Excel gốc.
Proposed Changes
1. Backend - Thêm thư viện chuyển đổi Excel sang PDF
[NEW] 
products/pdf_converter.py
Viết hàm convert_excel_to_pdf(excel_path: Path, output_dir: Path) -> Path:
Kiểm tra hệ điều hành (Windows / Linux).
Tự động quét tìm file thực thi soffice.exe của LibreOffice trong thư mục cài đặt mặc định trên Windows (C:\Program Files\LibreOffice\program\soffice.exe) hoặc dùng lệnh soffice trên Linux.
Chạy tiến trình con (subprocess) ở chế độ headless: soffice --headless --convert-to pdf --outdir <out_dir> <excel_file>.
Trả về đường dẫn file PDF kết quả.
[MODIFY] 
products/views.py
Cập nhật QuotationExportPDFView để tiếp nhận request (tương tự như API xuất Excel):
Lấy các tham số product_ids, customer_id và items_custom từ request.
Sử dụng hàm build_quotation_excel để sinh nội dung Excel báo giá dạng bytes.
Lưu file Excel tạm thời vào ổ đĩa.
Gọi hàm convert_excel_to_pdf để convert file Excel tạm thành file PDF.
Trả về file PDF cho Frontend dưới dạng response application/pdf.
Dọn dẹp (xóa bỏ) các file Excel và PDF tạm sau khi hoàn tất.
2. Frontend - Gọi API xuất PDF từ Backend & Xóa file cũ
[MODIFY] 
pages/search/components/quotation-dialog.tsx
Cập nhật hàm handleDownloadPDF để gửi yêu cầu POST lên API /quotations/export-pdf/ của Backend (truyền cả items_custom để nhận giá đã tích chọn/điền tay).
Hiển thị toast thông báo lỗi thân thiện nếu máy chủ chưa cấu hình/cài đặt LibreOffice.
[DELETE] 
pages/search/components/quotation-pdf.tsx
Xóa bỏ file này để làm sạch source code Frontend.
Verification Plan
Automated Tests
Chạy unit test và build frontend để đảm bảo không lỗi biên dịch:
powershell

npm run build
npm run lint
Manual Verification
Chọn sản phẩm, khách hàng, nhấn Tạo Báo Giá.
Trên màn hình xem trước, thay đổi đơn giá (vd: chọn giá VIP hoặc tự điền giá tay).
Nhấn nút Tải PDF.
Xác nhận file PDF tải xuống có nội dung, lề lối và logo giống hệt mẫu Excel của công ty Thiên Trường và hiển thị đúng các giá trị đơn giá đã tuỳ chọn.