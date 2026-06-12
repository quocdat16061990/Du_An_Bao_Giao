import { create } from 'zustand'
import type { Customer } from '../helper/types'

interface SearchStore {
  // Selected product IDs
  selectedProductIds: Set<number>
  toggleProduct: (id: number) => void
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
  toggleProduct: (id) =>
    set((state) => {
      const next = new Set(state.selectedProductIds)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return { selectedProductIds: next }
    }),
  selectAll: (ids) =>
    set(() => ({
      selectedProductIds: new Set(ids),
    })),
  clearSelection: () =>
    set(() => ({
      selectedProductIds: new Set(),
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
