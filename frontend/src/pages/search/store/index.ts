import { create } from 'zustand'
import type { Customer } from '../helper/types'

interface SearchStore {
  // Selected product IDs
  selectedProductIds: Set<number>
  productQuantities: Record<number, number>
  toggleProduct: (id: number) => void
  setProductQuantity: (id: number, quantity: number) => void
  selectAll: (ids: Array<number>) => void
  clearSelection: () => void

  // Selected customer
  selectedCustomer: Customer | null
  setCustomer: (customer: Customer | null) => void

  // UI state
  isQuotationOpen: boolean
  openQuotation: () => void
  closeQuotation: () => void

  isMobileFilterOpen: boolean
  openMobileFilter: () => void
  closeMobileFilter: () => void
}

export const useSearchStore = create<SearchStore>((set) => ({
  selectedProductIds: new Set<number>(),
  productQuantities: {},
  toggleProduct: (id) =>
    set((state) => {
      const next = new Set(state.selectedProductIds)
      const nextQuantities = { ...state.productQuantities }
      if (next.has(id)) {
        next.delete(id)
        delete nextQuantities[id]
      } else {
        next.add(id)
        nextQuantities[id] = 1
      }
      return { selectedProductIds: next, productQuantities: nextQuantities }
    }),
  setProductQuantity: (id, quantity) =>
    set((state) => ({
      productQuantities: {
        ...state.productQuantities,
        [id]: Math.max(1, quantity),
      },
    })),
  selectAll: (ids) =>
    set(() => {
      const quantities: Record<number, number> = {}
      ids.forEach((id) => {
        quantities[id] = 1
      })
      return {
        selectedProductIds: new Set(ids),
        productQuantities: quantities,
      }
    }),
  clearSelection: () =>
    set(() => ({
      selectedProductIds: new Set(),
      productQuantities: {},
    })),

  selectedCustomer: null,
  setCustomer: (customer) => set(() => ({ selectedCustomer: customer })),

  isQuotationOpen: false,
  openQuotation: () => set(() => ({ isQuotationOpen: true })),
  closeQuotation: () => set(() => ({ isQuotationOpen: false })),

  isMobileFilterOpen: false,
  openMobileFilter: () => set(() => ({ isMobileFilterOpen: true })),
  closeMobileFilter: () => set(() => ({ isMobileFilterOpen: false })),
}))
