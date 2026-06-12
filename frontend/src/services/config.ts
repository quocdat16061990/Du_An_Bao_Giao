/** API Base URL – Django backend */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

/** Company config */
export const COMPANY = {
  name: 'TURBO DIESEL',
  slogan: 'Chuyên Cung Cấp Turbo & Phụ Tùng Động Cơ',
  address: 'Địa chỉ công ty của bạn',
  phone: '09xx.xxx.xxx',
  email: 'email@turbodiesel.com',
  taxCode: 'Mã số thuế của bạn',
  bank: 'Ngân hàng: ... - STK: ...',
  terms:
    '- Bảo hành: 6 tháng đối với turbo, 3 tháng đối với ruột turbo.\n- Đổi trả trong 7 ngày nếu lỗi từ nhà sản xuất.\n- Hàng đặt không áp dụng đổi trả.\n- Giá trên chưa bao gồm VAT.',
  signature: 'TURBO DIESEL',
} as const

/** Page size mặc định */
export const DEFAULT_PAGE_SIZE = 20

/** Debounce delay cho search input (ms) */
export const SEARCH_DEBOUNCE_MS = 300
