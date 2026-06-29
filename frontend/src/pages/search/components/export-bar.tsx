import { useState } from 'react'
import { FileSpreadsheet, ShoppingCart, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSearchStore } from '../store'
import { CustomerSearch } from './customer-search'

export function ExportBar() {
  const selectedIds = useSearchStore((s) => s.selectedProductIds)
  const selectedCustomer = useSearchStore((s) => s.selectedCustomer)
  const clearSelection = useSearchStore((s) => s.clearSelection)
  const selectedCount = selectedIds.size
  const [customerError, setCustomerError] = useState(false)

  const ensureCanExport = () => {
    if (selectedCount > 0 && selectedCustomer && selectedCustomer.id > 0) return true
    setCustomerError(true)
    return false
  }

  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-card/95 px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
        <ShoppingCart className="h-4 w-4" />
        <span>Tick chọn sản phẩm để tạo báo giá</span>
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
            Vui lòng chọn hoặc thêm khách hàng trước khi tạo báo giá.
          </p>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          className="h-9 bg-turbo-blue hover:bg-turbo-blue/90 text-white font-bold"
          onClick={() => {
            if (ensureCanExport()) {
              useSearchStore.getState().openQuotation()
            }
          }}
          disabled={!selectedCustomer}
          title={!selectedCustomer ? 'Vui lòng chọn khách hàng trước' : 'Tạo và xem trước báo giá'}
        >
          <FileSpreadsheet className="mr-1.5 h-4 w-4" />
          Tạo Báo Giá
        </Button>
      </div>
    </div>
  )
}
