import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn, formatVnd, truncateOem } from '@/lib/utils'
import type { Product } from '../helper/types'
import { Wrench, Cpu, Tag, Flame, Cog } from 'lucide-react'

interface ProductCardProps {
  product: Product
  isSelected: boolean
  onToggleSelect: (id: number) => void
  viewMode: 'grid' | 'table'
  rowIndex?: number
}

export const ProductCard = memo(function ProductCard({
  product,
  isSelected,
  onToggleSelect,
  viewMode,
  rowIndex = 0,
}: ProductCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/products/${product.id}`)
  }

  const getBestPrice = (): { value: number | null; label: string; variant: 'vip' | 'uuDai' | 'daiLy' | 'default' } => {
    if (product.gia_vip) return { value: product.gia_vip, label: 'VIP', variant: 'vip' }
    if (product.gia_uu_dai) return { value: product.gia_uu_dai, label: 'Ưu đãi', variant: 'uuDai' }
    if (product.gia_dai_ly) return { value: product.gia_dai_ly, label: 'Đại lý', variant: 'daiLy' }
    return { value: product.gia_dl_10, label: 'Chung', variant: 'default' }
  }

  const bestPrice = getBestPrice()
  const isTurbo = product.loai === 'turbo' || product.loai === 'ruot' || product.loai === 'so_linh_kien_turbo'
  const displayName = product.ten_hang || product.model_turbo || '—'
  const catName = product.category_name || (isTurbo ? (product.loai === 'ruot' ? 'Ruột Turbo' : 'Turbo') : product.loai)

  // ── Price badge variant (matching reference design semantic colors) ──
  const priceBadgeClass = cn(
    'inline-flex items-center justify-center rounded-md px-[0.45rem] h-5.5 min-w-6 gap-1 text-[10px] font-medium shrink-0',
    bestPrice.variant === 'vip' && 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-500',
    bestPrice.variant === 'uuDai' && 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-500',
    bestPrice.variant === 'daiLy' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-500',
    bestPrice.variant === 'default' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  )

  const priceTextClass = cn(
    'text-sm font-semibold tabular-nums',
    bestPrice.variant === 'vip' && 'text-amber-700 dark:text-amber-400',
    bestPrice.variant === 'uuDai' && 'text-blue-700 dark:text-blue-400',
    bestPrice.variant === 'daiLy' && 'text-emerald-700 dark:text-emerald-400',
    bestPrice.variant === 'default' && 'text-secondary-foreground',
  )

  if (viewMode === 'table') {
    return (
      <tr
        className={cn(
          'hover:bg-muted/40 data-[state=selected]:bg-muted/50',
          'border-b border-border',
          'cursor-pointer',
          isSelected && 'bg-muted/40',
        )}
        onClick={handleClick}
      >
        {/* Checkbox */}
        <td
          className="align-middle px-4 py-3 border-e border-border w-[51px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="hidden absolute top-0 bottom-0 start-0 w-[2px] bg-primary" />
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(product.id)}
            className="h-[18px] w-[18px]"
            aria-label="Select row"
          />
        </td>

        {/* Loại / Category badge */}
        <td className="align-middle px-4 py-3 border-e border-border w-[110px]">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-semibold whitespace-nowrap border-0',
              isTurbo
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
            )}
          >
            {isTurbo ? (
              <><Flame className="size-3 mr-1" /> {product.loai === 'ruot' ? 'Ruột' : 'Turbo'}</>
            ) : (
              <><Cog className="size-3 mr-1" /> {catName}</>
            )}
          </Badge>
        </td>

        {/* Mã VT */}
        <td className="align-middle px-4 py-3 border-e border-border w-[130px]">
          <span className="font-mono text-[13px] font-semibold text-secondary-foreground">
            {product.ma_vt}
          </span>
        </td>

        {/* Tên hàng / Model */}
        <td className="align-middle px-4 py-3 border-e border-border min-w-[180px]">
          <div className="flex flex-col gap-0.5 max-w-[260px]">
            <span className="text-[13px] font-medium text-secondary-foreground truncate leading-tight" title={displayName}>
              {displayName}
            </span>
            {product.ma_dong_co && (
              <span className="text-[11px] text-muted-foreground truncate font-mono" title={product.ma_dong_co}>
                {product.ma_dong_co}
              </span>
            )}
          </div>
        </td>

        {/* OEM Part No */}
        <td className="align-middle px-4 py-3 border-e border-border w-[130px] hidden xl:table-cell">
          <OemCell oem={product.oem_part_no} />
        </td>

        {/* Hãng máy */}
        <td className="align-middle px-4 py-3 border-e border-border w-[110px]">
          <span className="text-[12px] text-secondary-foreground max-w-[110px] truncate block">
            {product.hang_may_name || '—'}
          </span>
        </td>

        {/* Thương hiệu */}
        <td className="align-middle px-4 py-3 border-e border-border w-[100px]">
          {product.thuong_hieu_name ? (
            <span className="text-[12px] text-secondary-foreground font-medium">
              {product.thuong_hieu_name}
            </span>
          ) : (
            <span className="text-[12px] text-muted-foreground">—</span>
          )}
        </td>

        {/* Giá */}
        <td className="align-middle px-4 py-3 text-right w-[160px]">
          <div className="flex items-center justify-end gap-2">
            <span className={priceTextClass}>
              {formatVnd(bestPrice.value)}
            </span>
            <span className={priceBadgeClass}>
              {bestPrice.label}
            </span>
          </div>
        </td>
      </tr>
    )
  }

  // Grid card view (giữ lại phòng khi cần)
  return (
    <div
      className={cn(
        'group relative overflow-hidden cursor-pointer rounded-xl border bg-card shadow-xs',
        'transition-all duration-200 hover:shadow-md hover:border-primary/30',
        isSelected && 'ring-2 ring-primary border-primary/50 bg-primary/5',
      )}
      onClick={handleClick}
    >
      <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(product.id)}
          className="h-4.5 w-4.5 bg-background/80 backdrop-blur"
        />
      </div>
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1',
          bestPrice.variant === 'vip' && 'bg-amber-500',
          bestPrice.variant === 'uuDai' && 'bg-blue-500',
          bestPrice.variant === 'daiLy' && 'bg-emerald-500',
          bestPrice.variant === 'default' && 'bg-muted-foreground/30',
        )}
      />
      <div className="p-4 pt-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-bold text-primary tracking-wide">
            {product.ma_vt}
          </span>
          {product.loai === 'ruot' && (
            <Badge variant="outline" className="text-[10px] shrink-0">Ruột</Badge>
          )}
          {bestPrice.variant !== 'default' && (
            <Badge variant={bestPrice.variant} className="text-[10px] shrink-0">{bestPrice.label}</Badge>
          )}
        </div>
        <h4 className="font-semibold text-sm leading-tight mb-2 line-clamp-2 text-foreground">
          {displayName || 'Sản phẩm'}
        </h4>
        <div className="space-y-1.5 mb-3 text-xs text-muted-foreground">
          {product.ma_dong_co && (
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3 shrink-0" />
              <span className="truncate">{product.ma_dong_co}</span>
            </div>
          )}
          {product.oem_part_no && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-3 w-3 shrink-0" />
              <span className="truncate font-mono text-[11px]">{shortOem(product.oem_part_no)}</span>
            </div>
          )}
          {product.hang_may_name && (
            <div className="flex items-center gap-1.5">
              <Wrench className="h-3 w-3 shrink-0" />
              <span className="truncate">{product.hang_may_name}</span>
              {product.thuong_hieu_name && <span className="text-[10px]">· {product.thuong_hieu_name}</span>}
            </div>
          )}
        </div>
        <div className="flex items-end justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Giá từ</span>
          <span className="text-base font-bold text-primary">{formatVnd(bestPrice.value)}</span>
        </div>
      </div>
    </div>
  )
})

// ── OEM Cell với click-to-expand ──
function OemCell({ oem }: { oem: string }) {
  const [expanded, setExpanded] = useState(false)
  if (!oem) return <span className="text-[12px] text-muted-foreground">—</span>

  const short = truncateOem(oem, 8)
  const needsTruncate = short !== oem.trim().split(/[/\s]+/)[0]

  return (
    <span
      className={cn(
        'text-[12px] font-mono max-w-[120px] block',
        needsTruncate && 'cursor-pointer hover:text-primary underline decoration-dotted underline-offset-2',
        expanded ? 'text-primary' : 'text-muted-foreground',
      )}
      title={expanded ? '' : 'Click để xem đầy đủ'}
      onClick={(e) => {
        e.stopPropagation()
        if (needsTruncate) setExpanded(!expanded)
      }}
    >
      {expanded ? shortOem(oem) : short}
    </span>
  )
}

/** Lấy OEM đầu tiên */
function shortOem(oem: string): string {
  if (!oem) return ''
  return oem.trim().split(/[/\s]+/)[0] || ''
}
