import type { PhanLoai } from './types'

export const PHAN_LOAI_OPTIONS: Array<{
  value: string
  label: string
  tag: PhanLoai
}> = [
  { value: 'vip', label: 'VIP', tag: 'VIP' },
  { value: 'uu_dai', label: 'Ưu đãi', tag: 'ƯU_ĐÃI' },
  { value: 'dai_ly', label: 'Đại lý', tag: 'ĐẠI_LÝ' },
  { value: 'dl_10', label: 'ĐL+10%', tag: 'KHÁC' },
] as const

export const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ma_vt', label: 'Mã VT (A→Z)' },
  { value: '-created_at', label: 'Mới nhất' },
  { value: 'model_turbo', label: 'Model (A→Z)' },
] as const

export const PRICE_MIN = 0
export const PRICE_MAX = 100_000_000
export const PRICE_STEP = 500_000
