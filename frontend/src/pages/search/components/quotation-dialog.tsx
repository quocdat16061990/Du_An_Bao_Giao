import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { QuotationPreview } from './quotation-preview'
import { useSearchStore } from '../store'
import { Printer, Loader2, FileDown } from 'lucide-react'
import { generateQuotationPdf } from './quotation-pdf'
import type { Product } from '../helper/types'

interface QuotationDialogProps {
  selectedProducts: Array<Product>
}

export function QuotationDialog({ selectedProducts }: QuotationDialogProps) {
  const isOpen = useSearchStore((s) => s.isQuotationOpen)
  const closeQuotation = useSearchStore((s) => s.closeQuotation)
  const selectedCustomer = useSearchStore((s) => s.selectedCustomer)
  const selectedIds = useSearchStore((s) => s.selectedProductIds)
  const [isDownloading, setIsDownloading] = useState(false)

  const quoteNumber = `BG${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`
  const quoteDate = new Date().toLocaleDateString('vi-VN')

  const handleDownloadPDF = async () => {
    if (!selectedCustomer) return
    setIsDownloading(true)
    try {
      const now = new Date()
      const quoteNumber = `BG${now.toISOString().slice(0, 10).replace(/-/g, '')}-01`
      const quoteDate = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

      const blob = await generateQuotationPdf(selectedProducts, selectedCustomer, quoteNumber, quoteDate)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = selectedCustomer.ten_kh.replace(/[^a-zA-Z0-9À-ỹ]/g, '_').substring(0, 30)
      a.download = `bao_gia_${safeName}_${now.toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  if (!selectedCustomer || selectedProducts.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeQuotation() }}>
      <DialogContent className="max-w-[900px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Báo Giá — {selectedCustomer.ten_kh}</DialogTitle>
          <DialogDescription>
            Xem trước báo giá. Bấm <strong>Tải PDF</strong> để lưu file.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <QuotationPreview
            products={selectedProducts}
            customer={selectedCustomer}
            quoteNumber={quoteNumber}
            quoteDate={quoteDate}
          />
        </ScrollArea>
        <div className="flex justify-end gap-2 px-6 pb-4">
          <Button variant="outline" onClick={closeQuotation}>Đóng</Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />In
          </Button>
          <Button onClick={handleDownloadPDF} className="bg-turbo-blue hover:bg-turbo-blue/90" disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Tải PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
