import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { Customer } from './types'

async function fetchCustomers(query: string): Promise<Array<Customer>> {
  const { data } = await apiClient.get<Array<Customer>>('/customers/search/', {
    params: { q: query },
  })
  return data
}

export function useCustomers(query: string) {
  return useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: () => fetchCustomers(query),
    enabled: query.length >= 1,
    staleTime: 60_000,
  })
}
