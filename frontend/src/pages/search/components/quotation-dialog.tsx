import { useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSearchStore } from '../store'
import { Printer, Loader2, FileDown, FileSpreadsheet, RefreshCw } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import type { Product } from '../helper/types'
import { toast } from 'sonner'
import { formatVnd } from '@/lib/utils'

interface QuotationDialogProps {
  selectedProducts: Array<Product>
}

type PriceChoice = { price: number; label: string }
type QuotePayload = {
  product_ids: Array<number>
  customer_id: number
  items_custom: Array<{ product_id: number; custom_price: number; price_label: string }>
}

const PDF_ERROR_FALLBACK = 'Tải PDF thất bại. Vui lòng kiểm tra lại cấu hình LibreOffice trên máy chủ.'

export function QuotationDialog({ selectedProducts }: QuotationDialogProps) {
  const isOpen = useSearchStore((s) => s.isQuotationOpen)
  const closeQuotation = useSearchStore((s) => s.closeQuotation)
  const selectedCustomer = useSearchStore((s) => s.selectedCustomer)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [customPrices, setCustomPrices] = useState<Record<number, PriceChoice>>({})

  useEffect(() => {
    if (!isOpen) {
      setCustomPrices({})
      setPreviewError(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }
  }, [isOpen, previewUrl])

  const getDefaultPriceChoice = (product: Product): PriceChoice => {
    switch (selectedCustomer?.phan_loai) {
      case 'VIP':
        return { price: product.gia_vip ?? product.gia_dl_10 ?? 0, label: 'GIÁ VIP' }
      case 'ƯU_ĐÃI':
        return { price: product.gia_uu_dai ?? product.gia_dl_10 ?? 0, label: 'GIÁ ƯU ĐÃI' }
      case 'ĐẠI_LÝ':
        return { price: product.gia_dai_ly ?? product.gia_dl_10 ?? 0, label: 'GIÁ ĐẠI LÝ' }
      default:
        return { price: product.gia_dl_10 ?? 0, label: 'GIÁ ĐL+10%' }
    }
  }

  const getSelectedPriceChoice = (product: Product): PriceChoice => (
    customPrices[product.id] ?? getDefaultPriceChoice(product)
  )

  const getPriceOptions = (product: Product) => [
    product.gia_vip ? { value: 'GIÁ VIP', label: 'VIP', price: product.gia_vip } : null,
    product.gia_uu_dai ? { value: 'GIÁ ƯU ĐÃI', label: 'Ưu đãi', price: product.gia_uu_dai } : null,
    product.gia_dai_ly ? { value: 'GIÁ ĐẠI LÝ', label: 'Đại lý', price: product.gia_dai_ly } : null,
    product.gia_dl_10 ? { value: 'GIÁ ĐL+10%', label: 'ĐL+10%', price: product.gia_dl_10 } : null,
  ].filter((item): item is { value: string; label: string; price: number } => item !== null)

  const quotePayload = useMemo<QuotePayload | null>(() => {
    if (!selectedCustomer || selectedCustomer.id <= 0 || selectedProducts.length === 0) {
      return null
    }

    return {
      product_ids: selectedProducts.map((product) => product.id),
      customer_id: selectedCustomer.id,
      items_custom: selectedProducts.map((product) => {
        const selectedPrice = customPrices[product.id] ?? (() => {
          switch (selectedCustomer.phan_loai) {
            case 'VIP':
              return { price: product.gia_vip ?? product.gia_dl_10 ?? 0, label: 'GIÁ VIP' }
            case 'ƯU_ĐÃI':
              return { price: product.gia_uu_dai ?? product.gia_dl_10 ?? 0, label: 'GIÁ ƯU ĐÃI' }
            case 'ĐẠI_LÝ':
              return { price: product.gia_dai_ly ?? product.gia_dl_10 ?? 0, label: 'GIÁ ĐẠI LÝ' }
            default:
              return { price: product.gia_dl_10 ?? 0, label: 'GIÁ ĐL+10%' }
          }
        })()
        return {
          product_id: product.id,
          custom_price: selectedPrice.price,
          price_label: selectedPrice.label,
        }
      }),
    }
  }, [selectedCustomer, selectedProducts, customPrices])

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

  const readApiError = async (err: unknown, fallback: string): Promise<string> => {
    const responseData =
      typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: unknown } }).response?.data
        : undefined

    if (responseData instanceof Blob) {
      try {
        const text = await responseData.text()
        const json = JSON.parse(text) as { error?: unknown }
        if (typeof json.error === 'string') return json.error
      } catch {
        console.warn('Could not parse quotation error response')
      }
    }

    if (
      typeof responseData === 'object' &&
      responseData !== null &&
      'error' in responseData &&
      typeof (responseData as { error?: unknown }).error === 'string'
    ) {
      return (responseData as { error: string }).error
    }

    return fallback
  }

  const refreshPreview = async (payload: QuotePayload, signal?: AbortSignal) => {
    setIsPreviewLoading(true)
    setPreviewError(null)
    try {
      const response = await apiClient.post('/quotations/preview-pdf/', payload, {
        responseType: 'blob',
        timeout: 120000,
        signal,
      })
      const nextUrl = URL.createObjectURL(response.data)
      setPreviewUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl)
        return nextUrl
      })
    } catch (err: unknown) {
      if (signal?.aborted) return
      const message = await readApiError(err, 'Không thể tạo preview PDF từ file Excel.')
      setPreviewError(message)
      toast.error(message)
    } finally {
      if (!signal?.aborted) setIsPreviewLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !quotePayload) return

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void refreshPreview(quotePayload, controller.signal)
    }, 350)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [isOpen, quotePayload])

  const handleDownloadExcel = async () => {
    if (!selectedCustomer || !quotePayload) return
    setIsDownloadingExcel(true)
    try {
      const response = await apiClient.post('/quotations/export-excel/', quotePayload, {
        responseType: 'blob',
        timeout: 60000,
      })
      const disposition = response.headers['content-disposition']
      const match = /filename="?([^"]+)"?/i.exec(disposition ?? '')
      const safeName = selectedCustomer.ten_kh.replace(/[^a-zA-Z0-9À-ỹ]/g, '_').substring(0, 30)
      downloadBlob(response.data, match?.[1] ?? `bao_gia_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err: unknown) {
      const message = await readApiError(err, 'Tải Excel thất bại.')
      toast.error(message)
    } finally {
      setIsDownloadingExcel(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedCustomer || !quotePayload) return
    setIsDownloadingPdf(true)
    try {
      const response = await apiClient.post('/quotations/export-pdf/', quotePayload, {
        responseType: 'blob',
        timeout: 120000,
      })

      const disposition = response.headers['content-disposition']
      const match = /filename="?([^"]+)"?/i.exec(disposition ?? '')
      const safeName = selectedCustomer.ten_kh.replace(/[^a-zA-Z0-9À-ỹ]/g, '_').substring(0, 30)
      downloadBlob(
        response.data,
        match?.[1] ?? `bao_gia_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`,
      )
    } catch (err: unknown) {
      const message = await readApiError(err, PDF_ERROR_FALLBACK)
      toast.error(message)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handlePrint = () => {
    if (!previewUrl) return
    const previewWindow = window.open(previewUrl, '_blank')
    previewWindow?.addEventListener('load', () => previewWindow.print(), { once: true })
  }

  if (!selectedCustomer || selectedCustomer.id <= 0 || selectedProducts.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeQuotation() }}>
      <DialogContent className="max-w-[1120px] h-[92vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle>Báo Giá - {selectedCustomer.ten_kh}</DialogTitle>
          <DialogDescription>
            Preview bên dưới được render trực tiếp từ file Excel mẫu trước khi tải PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-r bg-muted/20">
            <ScrollArea className="h-full px-4 py-4">
              <div className="space-y-3">
                {selectedProducts.map((product) => {
                  const selectedPrice = getSelectedPriceChoice(product)
                  const options = getPriceOptions(product)
                  const isCustom = selectedPrice.label === 'GIÁ ĐIỀN TAY'
                  return (
                    <div key={product.id} className="rounded-md border bg-background p-3">
                      <div className="mb-2 text-xs font-semibold leading-snug">
                        {product.ma_vt} {product.ten_hang || product.model_turbo ? `- ${product.ten_hang || product.model_turbo}` : ''}
                      </div>
                      <select
                        className="mb-2 h-8 w-full rounded-md border bg-background px-2 text-xs"
                        value={isCustom ? 'CUSTOM' : selectedPrice.label}
                        onChange={(event) => {
                          const value = event.target.value
                          if (value === 'CUSTOM') {
                            setCustomPrices((current) => ({
                              ...current,
                              [product.id]: { price: selectedPrice.price || 0, label: 'GIÁ ĐIỀN TAY' },
                            }))
                            return
                          }
                          const option = options.find((item) => item.value === value)
                          if (!option) return
                          setCustomPrices((current) => ({
                            ...current,
                            [product.id]: { price: option.price, label: option.value },
                          }))
                        }}
                      >
                        {options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}: {formatVnd(option.price)}
                          </option>
                        ))}
                        <option value="CUSTOM">Giá điền tay</option>
                      </select>
                      <input
                        type="number"
                        className="h-8 w-full rounded-md border bg-background px-2 text-right text-xs font-semibold"
                        value={selectedPrice.price || ''}
                        onChange={(event) => {
                          const value = Number(event.target.value) || 0
                          setCustomPrices((current) => ({
                            ...current,
                            [product.id]: { price: value, label: 'GIÁ ĐIỀN TAY' },
                          }))
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </aside>

          <main className="relative min-h-0 bg-slate-100">
            {previewUrl && !previewError ? (
              <iframe
                title="Preview báo giá PDF"
                src={previewUrl}
                className="h-full w-full border-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                {previewError ?? 'Đang tạo preview từ Excel...'}
              </div>
            )}
            {isPreviewLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </main>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={closeQuotation}>Đóng</Button>
          <Button variant="outline" onClick={() => quotePayload && refreshPreview(quotePayload)} disabled={isPreviewLoading}>
            {isPreviewLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Làm mới
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={!previewUrl || isPreviewLoading}>
            <Printer className="mr-2 h-4 w-4" />In
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloadingPdf || isDownloadingExcel}>
            {isDownloadingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Tải PDF
          </Button>
          <Button onClick={handleDownloadExcel} className="bg-turbo-blue hover:bg-turbo-blue/90" disabled={isDownloadingExcel || isDownloadingPdf}>
            {isDownloadingExcel ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Tải Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
