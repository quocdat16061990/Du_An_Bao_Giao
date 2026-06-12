// ── Product (khớp với API Django response - snake_case) ──
export interface Product {
  id: number
  loai: string
  ma_vt: string
  ten_hang?: string
  model_turbo: string
  ma_dong_co: string
  oem_part_no: string
  dac_diem: string
  ung_dung: string
  ghi_chu: string
  hinh_anh: string
  // Common fields
  dvt?: string
  doi_th_sx?: string
  parno?: string
  // FKs
  hang_may: number
  hang_may_name: string
  hang_sx: number | null
  hang_sx_name: string
  thuong_hieu: number | null
  thuong_hieu_name: string
  category?: number
  category_name?: string
  // Giá
  gia_von?: number | null
  gia_vip: number | null
  gia_uu_dai: number | null
  gia_dai_ly: number | null
  gia_gara?: number | null
  gia_dl_10: number | null
  // Kỹ thuật
  cg_duoi: string | null
  cg_dinh: string | null
  cg_so: string
  cl_duoi: string | null
  cl_dinh: string | null
  cl_so: string
  // Category-specific attributes
  attributes?: Record<string, string>
  // Meta
  sheet_name: string
  is_active: boolean
  created_at: string
}

// ── Category ──
export interface Category {
  id: number
  ten: string
  slug: string
  mo_ta: string
  order: number
  product_count: number
}

// ── Customer (khớp API) ──
export type PhanLoai = 'VIP' | 'ƯU_ĐÃI' | 'NGOẠI_LỆ' | 'CHƯA_PL'

export interface Customer {
  id: number
  ma_kh: string
  ten_kh: string
  dien_thoai: string
  phan_loai: PhanLoai
  dia_chi: string
  tinh_tp: string
  ghi_chu: string
  nha_xe: number | null
  nha_xe_name: string
  is_active: boolean
  created_at: string
}

// ── Search ──
export interface SearchParams {
  q?: string
  category?: number
  phan_loai_gia?: string
  min_price?: number | string
  max_price?: number | string
  sheet?: string
  ordering?: string
  page?: number
  page_size?: number
}

// ── API Response ──
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  total_pages: number
  current_page: number
  results: Array<T>
}

// ── Quotation ──
export interface QuotationProduct {
  id: number
  ma_vt: string
  ten_hang?: string
  model_turbo?: string
  ma_dong_co?: string
  oem_part_no?: string
  dac_diem?: string
  ung_dung?: string
  don_gia: number
  so_luong: number
  thanh_tien: number
}

export interface QuotationResponse {
  quote_number: string
  quote_date: string
  customer: Customer
  gia_ap_dung: string
  products: Array<QuotationProduct>
  tong_cong: number
  tong_chu: string
  company: Record<string, string>
}
