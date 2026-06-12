import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RotateCcw, Filter } from 'lucide-react'
import { PHAN_LOAI_OPTIONS, PRICE_MIN, PRICE_MAX, PRICE_STEP } from '../helper/constants'
import { formatVnd } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface FilterPanelProps {
  search: string
  onSearchChange: (value: string) => void
  selectedLoaiGia: string
  onLoaiGiaChange: (value: string) => void
  priceRange: [number, number]
  onPriceRangeChange: (value: [number, number]) => void
  onClearAll: () => void
  hasActiveFilters: boolean
  className?: string
}

export function FilterPanel({
  search,
  onSearchChange,
  selectedLoaiGia,
  onLoaiGiaChange,
  priceRange,
  onPriceRangeChange,
  onClearAll,
  hasActiveFilters,
  className,
}: FilterPanelProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">BỘ LỌC</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 text-xs text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Xóa lọc
          </Button>
        )}
      </div>

      <Separator className="mb-4" />

      <ScrollArea className="flex-1">
        <div className="space-y-6 pr-3">
          {/* Quick search */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              🔎 Tìm nhanh
            </Label>
            <input
              type="text"
              placeholder="Lọc trong kết quả..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Loại giá */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              📊 Loại giá
            </Label>
            <div className="space-y-2">
              {PHAN_LOAI_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    'hover:bg-muted/50',
                    selectedLoaiGia === opt.value && 'bg-primary/5 border border-primary/20',
                  )}
                >
                  <Checkbox
                    checked={selectedLoaiGia === opt.value}
                    onCheckedChange={() =>
                      onLoaiGiaChange(selectedLoaiGia === opt.value ? '' : opt.value)
                    }
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span
                    className={cn(
                      'ml-auto text-xs px-2 py-0.5 rounded-full font-medium',
                      opt.tag === 'VIP' && 'bg-yellow-100 text-yellow-800',
                      opt.tag === 'ƯU_ĐÃI' && 'bg-blue-100 text-blue-800',
                      opt.tag === 'ĐẠI_LÝ' && 'bg-green-100 text-green-800',
                      opt.tag === 'KHÁC' && 'bg-gray-100 text-gray-700',
                    )}
                  >
                    {opt.tag}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              💰 Khoảng giá
            </Label>
            <div className="px-1">
              <Slider
                value={priceRange}
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                onValueChange={(value: Array<number>) =>
                  onPriceRangeChange([value[0] ?? PRICE_MIN, value[1] ?? PRICE_MAX])
                }
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{formatVnd(priceRange[0])}</span>
              <span className="font-medium text-foreground">{formatVnd(priceRange[1])}</span>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

/** FilterPanel bọc trong Sheet cho mobile */
interface FilterSheetProps {
  open: boolean
  onClose: () => void
  // Same filter props
  search: string
  onSearchChange: (value: string) => void
  selectedLoaiGia: string
  onLoaiGiaChange: (value: string) => void
  priceRange: [number, number]
  onPriceRangeChange: (value: [number, number]) => void
  onClearAll: () => void
  hasActiveFilters: boolean
}

export function FilterSheetContent({
  search,
  onSearchChange,
  selectedLoaiGia,
  onLoaiGiaChange,
  priceRange,
  onPriceRangeChange,
  onClearAll,
  hasActiveFilters,
}: FilterSheetProps) {
  return (
    <FilterPanel
      search={search}
      onSearchChange={onSearchChange}
      selectedLoaiGia={selectedLoaiGia}
      onLoaiGiaChange={onLoaiGiaChange}
      priceRange={priceRange}
      onPriceRangeChange={onPriceRangeChange}
      onClearAll={onClearAll}
      hasActiveFilters={hasActiveFilters}
      className="h-full pt-6"
    />
  )
}
