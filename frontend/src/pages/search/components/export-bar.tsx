import { useState } from 'react'
import { FileSpreadsheet, Loader2, ShoppingCart, X } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import type { Product } from '../helper/types'
import { useSearchStore } from '../store'
import { CustomerSearch } from './customer-search'

interface ExportBarProps {
  products: Array<Product>
}

const safeFilenamePart = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 30)

export function ExportBar({ products }: ExportBarProps) {
  const selectedIds = useSearchStore((s) => s.selectedProductIds)
  const selectedCustomer = useSearchStore((s) => s.selectedCustomer)
  const clearSelection = useSearchStore((s) => s.clearSelection)
  const selectedCount = selectedIds.size
  const selectedProducts = products.filter((p) => selectedIds.has(p.id))
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [customerError, setCustomerError] = useState(false)

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const ensureCanExport = () => {
    if (selectedCount > 0 && selectedCustomer && selectedCustomer.id > 0) return true
    setCustomerError(true)
    return false
  }

  const handleExportExcel = async () => {
    if (!ensureCanExport() || !selectedCustomer) return

    setIsExportingExcel(true)
    try {
      const response = await apiClient.post(
        '/quotations/export-excel/',
        {
          product_ids: selectedProducts.map((p) => p.id),
          customer_id: selectedCustomer.id,
        },
        { responseType: 'blob' },
      )

      const disposition = response.headers['content-disposition']
      const match = /filename="?([^"]+)"?/i.exec(disposition ?? '')
      const safeName = safeFilenamePart(selectedCustomer.ten_kh)
      const datePart = new Date().toISOString().slice(0, 10)

      downloadBlob(response.data, match?.[1] ?? `bao_gia_${safeName}_${datePart}.xlsx`)
      toast.success('Đã xuất Excel và lưu báo giá')
    } catch (err) {
      console.error('Excel export failed:', err)
      toast.error('Xuất Excel hoặc lưu báo giá thất bại')
    } finally {
      setIsExportingExcel(false)
    }
  }

  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-card/95 px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
        <ShoppingCart className="h-4 w-4" />
        <span>Tick chọn sản phẩm để xuất Excel và lưu báo giá</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/80 bg-card/95 px-4 py-3 shadow-sm">
      <div className="mr-2 flex items-center gap-2">
        <Badge variant="default" className="h-7 px-3 text-sm font-bold">
          {selectedCount}
        </Badge>
        <span className="text-sm font-medium">sản phẩm được chọn</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSelection}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="mr-1 h-3 w-3" />
          Bỏ chọn
        </Button>
      </div>

      <div className="ml-1 border-l pl-3">
        <CustomerSearch
          hasError={customerError && !selectedCustomer}
          onValidSelect={() => setCustomerError(false)}
        />
        {customerError && !selectedCustomer && (
          <p className="mt-1 text-xs font-medium text-destructive">
            Vui lòng chọn hoặc thêm khách hàng trước khi xuất báo giá.
          </p>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={handleExportExcel}
          disabled={isExportingExcel || !selectedCustomer}
          title={!selectedCustomer ? 'Vui lòng chọn khách hàng trước' : 'Tải Excel và lưu báo giá'}
        >
          {isExportingExcel ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
          )}
          Excel
        </Button>
      </div>
    </div>
  )
}
