import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CustomerSearch } from './customer-search'
import { useSearchStore } from '../store'
import { FileText, FileSpreadsheet, FileDown, ShoppingCart, X, Loader2 } from 'lucide-react'
import type { Product } from '../helper/types'
import { apiClient } from '@/lib/api/client'
import { generateQuotationPdf } from './quotation-pdf'

interface ExportBarProps {
  products: Array<Product>
}

export function ExportBar({ products }: ExportBarProps) {
  const selectedIds = useSearchStore((s) => s.selectedProductIds)
  const selectedCustomer = useSearchStore((s) => s.selectedCustomer)
  const openQuotation = useSearchStore((s) => s.openQuotation)
  const clearSelection = useSearchStore((s) => s.clearSelection)
  const selectedCount = selectedIds.size
  const selectedProducts = products.filter((p) => selectedIds.has(p.id))
  const [isExportingPdf, setIsExportingPdf] = useState(false)
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

  const handleExportExcel = async () => {
    if (selectedCount === 0 || !selectedCustomer) {
      setCustomerError(true)
      return
    }

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
      const safeName = selectedCustomer.ten_kh.replace(/[^a-zA-Z0-9À-ỹ]/g, '_').substring(0, 30)
      downloadBlob(response.data, match?.[1] ?? `bao_gia_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) {
      console.error('Excel export failed:', err)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPDF = async () => {
    if (selectedCount === 0 || !selectedCustomer) return
    setIsExportingPdf(true)
    try {
      const now = new Date()
      const quoteNumber = `BG${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(selectedCount).padStart(2, '0')}`
      const quoteDate = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

      const blob = await generateQuotationPdf(selectedProducts, selectedCustomer, quoteNumber, quoteDate)
      const safeName = selectedCustomer.ten_kh.replace(/[^a-zA-Z0-9À-ỹ]/g, '_').substring(0, 30)
      downloadBlob(blob, `bao_gia_${safeName}_${now.toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleOpenQuotation = async () => {
    if (!selectedCustomer) {
      setCustomerError(true)
      return
    }
    try {
      await apiClient.post('/quotations/save/', {
        product_ids: selectedProducts.map((p) => p.id),
        customer_id: selectedCustomer.id,
        nhan_vien: '',
      })
    } catch (err) {
      console.warn('Lưu báo giá thất bại:', err)
    }
    openQuotation()
  }

  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-card/95 border border-border/80 rounded-lg shadow-sm text-sm text-muted-foreground">
        <ShoppingCart className="h-4 w-4" />
        <span>Tick chọn sản phẩm để tạo báo giá hoặc xuất Excel/PDF</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-card/95 border border-border/80 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mr-2">
        <Badge variant="default" className="h-7 px-3 text-sm font-bold">{selectedCount}</Badge>
        <span className="text-sm font-medium">sản phẩm được chọn</span>
        <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs text-muted-foreground hover:text-destructive">
          <X className="h-3 w-3 mr-1" />Bỏ chọn
        </Button>
      </div>
      <div className="border-l pl-3 ml-1">
        <CustomerSearch
          hasError={customerError && !selectedCustomer}
          onValidSelect={() => setCustomerError(false)}
        />
        {customerError && !selectedCustomer && (
          <p className="mt-1 text-xs font-medium text-destructive">
            Vui lòng chọn hoặc thêm khách hàng trước khi tạo báo giá.
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <Button size="sm" className="h-9 bg-turbo-blue hover:bg-turbo-blue/90 text-white shadow-sm" onClick={handleOpenQuotation}>
          <FileText className="h-4 w-4 mr-1.5" />Tạo Báo Giá
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={handleExportExcel}
          disabled={isExportingExcel || !selectedCustomer}
          title={!selectedCustomer ? 'Vui lòng chọn khách hàng trước' : 'Tải Excel báo giá'}
        >
          {isExportingExcel ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
          )}
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={handleExportPDF}
          disabled={isExportingPdf || !selectedCustomer}
          title={!selectedCustomer ? 'Vui lòng chọn khách hàng trước' : 'Tải PDF báo giá'}
        >
          {isExportingPdf ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-1.5" />
          )}
          PDF
        </Button>
      </div>
    </div>
  )
}
