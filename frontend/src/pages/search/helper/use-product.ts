import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { Product } from './types'

const fetchProduct = async (id: number): Promise<Product> => {
  const { data } = await apiClient.get<Product>(`/products/${id}/`)
  return data
}

export function useProduct(id: number) {
  return useQuery<Product>({
    queryKey: ['product', 'detail', id],
    queryFn: () => fetchProduct(id),
    enabled: id > 0,
    staleTime: 60_000,
    retry: 1,
  })
}
