import { create } from 'zustand'
import type { Customer, Product } from '../helper/types'

interface SearchStore {
  // Selected product IDs
  selectedProductIds: Set<number>
  selectedProductsMap: Record<number, Product>
  productQuantities: Record<number, number>
  toggleProduct: (product: Product) => void
  setProductQuantity: (id: number, quantity: number) => void
  selectAll: (products: Array<Product>) => void
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
  selectedProductsMap: {},
  productQuantities: {},
  toggleProduct: (product) =>
    set((state) => {
      const next = new Set(state.selectedProductIds)
      const nextQuantities = { ...state.productQuantities }
      const nextProductsMap = { ...state.selectedProductsMap }
      if (next.has(product.id)) {
        next.delete(product.id)
        Reflect.deleteProperty(nextQuantities, product.id)
        Reflect.deleteProperty(nextProductsMap, product.id)
      } else {
        next.add(product.id)
        nextQuantities[product.id] = 1
        nextProductsMap[product.id] = product
      }
      return { selectedProductIds: next, productQuantities: nextQuantities, selectedProductsMap: nextProductsMap }
    }),
  setProductQuantity: (id, quantity) =>
    set((state) => ({
      productQuantities: {
        ...state.productQuantities,
        [id]: Math.max(1, quantity),
      },
    })),
  selectAll: (products) =>
    set(() => {
      const nextIds = new Set<number>()
      const quantities: Record<number, number> = {}
      const nextProductsMap: Record<number, Product> = {}
      products.forEach((p) => {
        nextIds.add(p.id)
        quantities[p.id] = 1
        nextProductsMap[p.id] = p
      })
      return {
        selectedProductIds: nextIds,
        productQuantities: quantities,
        selectedProductsMap: nextProductsMap,
      }
    }),
  clearSelection: () =>
    set(() => ({
      selectedProductIds: new Set(),
      selectedProductsMap: {},
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
