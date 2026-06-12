import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { PaginatedResponse, Product, SearchParams } from './types'
import { DEFAULT_PAGE_SIZE } from '@/services/config'

async function fetchProducts(
  params: SearchParams,
): Promise<PaginatedResponse<Product>> {
  const { data } = await apiClient.get<PaginatedResponse<Product>>(
    '/products/',
    { params },
  )
  return data
}

export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: ['products', 'search', params],
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
