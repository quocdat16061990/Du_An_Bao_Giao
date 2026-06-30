import { describe, it, expect, beforeEach } from 'vitest'
import { useSearchStore } from '../pages/search/store'
import type { Product } from '../pages/search/helper/types'

const mockProduct1 = {
  id: 1,
  loai: 'turbo',
  ma_vt: 'VT001',
  model_turbo: 'TD13',
  ma_dong_co: 'S6R',
  oem_part_no: 'OEM001',
  dac_diem: 'dac diem 1',
  ung_dung: 'ung dung 1',
  ghi_chu: 'ghi chu 1',
  hinh_anh: 'img1.png',
  hang_may: 1,
  hang_may_name: 'MITSUBISHI',
  hang_sx: 1,
  hang_sx_name: 'MITSUBISHI',
  thuong_hieu: 1,
  thuong_hieu_name: 'MITSUBISHI',
  sheet_name: 'Turbo',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  gia_vip: 1000000,
  gia_uu_dai: 1100000,
  gia_dai_ly: 1200000,
  gia_dl_10: 1300000
} as unknown as Product

const mockProduct2 = {
  id: 2,
  loai: 'ruot',
  ma_vt: 'VT002',
  model_turbo: 'S400',
  ma_dong_co: 'S6D',
  oem_part_no: 'OEM002',
  dac_diem: 'dac diem 2',
  ung_dung: 'ung dung 2',
  ghi_chu: 'ghi chu 2',
  hinh_anh: 'img2.png',
  hang_may: 2,
  hang_may_name: 'KOMATSU',
  hang_sx: 2,
  hang_sx_name: 'KOMATSU',
  thuong_hieu: 2,
  thuong_hieu_name: 'KOMATSU',
  sheet_name: 'Ruot',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  gia_vip: 2000000,
  gia_uu_dai: 2100000,
  gia_dai_ly: 2200000,
  gia_dl_10: 2300000
} as unknown as Product

describe('SearchStore', () => {
  beforeEach(() => {
    useSearchStore.getState().clearSelection()
  })

  it('should initialize with empty selection', () => {
    const state = useSearchStore.getState()
    expect(state.selectedProductIds.size).toBe(0)
    expect(Object.keys(state.selectedProductsMap || {}).length).toBe(0)
  })

  it('should toggle product correctly', () => {
    // Select product 1
    useSearchStore.getState().toggleProduct(mockProduct1)
    let state = useSearchStore.getState()
    expect(state.selectedProductIds.has(mockProduct1.id)).toBe(true)
    expect(state.selectedProductsMap[mockProduct1.id]).toEqual(mockProduct1)

    // Unselect product 1
    useSearchStore.getState().toggleProduct(mockProduct1)
    state = useSearchStore.getState()
    expect(state.selectedProductIds.has(mockProduct1.id)).toBe(false)
    expect(state.selectedProductsMap[mockProduct1.id]).toBeUndefined()
  })

  it('should select all products', () => {
    useSearchStore.getState().selectAll([mockProduct1, mockProduct2])
    const state = useSearchStore.getState()
    expect(state.selectedProductIds.size).toBe(2)
    expect(state.selectedProductIds.has(mockProduct1.id)).toBe(true)
    expect(state.selectedProductIds.has(mockProduct2.id)).toBe(true)
    expect(state.selectedProductsMap[mockProduct1.id]).toEqual(mockProduct1)
    expect(state.selectedProductsMap[mockProduct2.id]).toEqual(mockProduct2)
  })

  it('should clear selection', () => {
    useSearchStore.getState().toggleProduct(mockProduct1)
    useSearchStore.getState().clearSelection()
    const state = useSearchStore.getState()
    expect(state.selectedProductIds.size).toBe(0)
    expect(Object.keys(state.selectedProductsMap || {}).length).toBe(0)
  })
})
