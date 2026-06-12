import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs))
}

/** Format số thành tiền VNĐ */
export function formatVnd(value: number | null | undefined): string {
  if (value == null || value === 0) return 'Liên hệ'
  return value.toLocaleString('vi-VN') + ' ₫'
}

/** Lấy mã OEM đầu tiên (trước / hoặc khoảng trắng) */
export function shortOem(oem: string): string {
  if (!oem) return ''
  return oem.trim().split(/[/\s]+/)[0] || ''
}

/** Rút gọn OEM — 8 ký tự đầu + "..." nếu dài hơn */
export function truncateOem(oem: string, maxLen = 8): string {
  const first = shortOem(oem)
  if (!first) return '—'
  if (first.length <= maxLen) return first
  return first.slice(0, maxLen) + '…'
}
