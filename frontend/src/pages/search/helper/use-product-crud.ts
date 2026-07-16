import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { Product } from './types'

export interface ProductInput {
  loai: string
  ma_vt: string
  ten_hang?: string
  dvt?: string
  doi_th_sx?: string
  parno?: string
  hang_may: number
  hang_sx?: number | null
  thuong_hieu?: number | null
  category?: number | null
  model_turbo?: string
  ma_dong_co?: string
  oem_part_no?: string
  dac_diem?: string
  ung_dung?: string
  ghi_chu?: string
  hinh_anh?: string
  danh_sach_hinh_anh?: string[]
  gia_von?: number | null
  gia_vip?: number | null
  gia_uu_dai?: number | null
  gia_dai_ly?: number | null
  gia_gara?: number | null
  gia_dl_10?: number | null
  cg_duoi?: number | string | null
  cg_dinh?: number | string | null
  cg_so?: string
  cl_duoi?: number | string | null
  cl_dinh?: number | string | null
  cl_so?: string
  attributes?: Record<string, string>
  is_active?: boolean
}

export function useProductCrud() {
  const queryClient = useQueryClient()

  const createMutation = useMutation<Product, Error, ProductInput>({
    mutationFn: async (data) => {
      const res = await apiClient.post<Product>('/products/', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-stats'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const updateMutation = useMutation<Product, Error, { id: number; data: ProductInput }>({
    mutationFn: async ({ id, data }) => {
      const res = await apiClient.patch<Product>(`/products/${id}/`, data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['product-stats'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const deleteMutation = useMutation<null, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/products/${id}/`)
      return null
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-stats'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const uploadImageMutation = useMutation<{ url: string; name: string }, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post<{ url: string; name: string }>('/products/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return res.data
    },
  })

  return {
    createProduct: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteProduct: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    uploadImage: uploadImageMutation.mutateAsync,
    isUploading: uploadImageMutation.isPending,
  }
}
