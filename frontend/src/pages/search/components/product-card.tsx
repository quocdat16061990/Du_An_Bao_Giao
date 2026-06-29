import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { getMediaUrl } from '@/lib/media'
import { cn, formatVnd } from '@/lib/utils'
import type { Product } from '../helper/types'
import { Check, Wrench } from 'lucide-react'

interface ProductCardProps {
  product: Product
  isSelected: boolean
  onToggleSelect: (id: number) => void
  viewMode: 'grid' | 'table'
  rowIndex?: number
}

type PriceMeta = {
  value: number | null
  label: string
  colorClass: string
  badgeClass: string
  barClass: string
}

export const ProductCard = memo(function ProductCard({
  product,
  isSelected,
  onToggleSelect,
  viewMode,
}: ProductCardProps) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  const handleClick = () => {
    navigate(`/products/${product.id}`)
  }

  const getBestPrice = (): PriceMeta => {
    if (product.gia_vip) {
      return {
        value: product.gia_vip,
        label: 'VIP',
        colorClass: 'price-vip',
        badgeClass: 'bg-amber-600 border-amber-700 text-white shadow-sm',
        barClass: 'bg-amber-600',
      }
    }

    if (product.gia_uu_dai) {
      return {
        value: product.gia_uu_dai,
        label: 'Ưu đãi',
        colorClass: 'price-uu-dai',
        badgeClass: 'bg-orange-600 border-orange-700 text-white shadow-sm',
        barClass: 'bg-orange-600',
      }
    }

    if (product.gia_dai_ly) {
      return {
        value: product.gia_dai_ly,
        label: 'Đại lý',
        colorClass: 'price-dai-ly',
        badgeClass: 'bg-sky-700 border-sky-800 text-white shadow-sm',
        barClass: 'bg-sky-700',
      }
    }

    return {
      value: product.gia_dl_10,
      label: 'ĐL+10%',
      colorClass: 'price-dl10',
      badgeClass: 'bg-teal-700 border-teal-800 text-white shadow-sm',
      barClass: 'bg-teal-700',
    }
  }

  const bestPrice = getBestPrice()
  const displayName = product.ten_hang || product.model_turbo || product.ma_vt
  const imageUrl = getMediaUrl(product.hinh_anh)
  const hasImage = imageUrl && !imgError

  const isTurbo = product.loai === 'turbo' || product.loai === 'ruot' || product.loai === 'so_linh_kien_turbo'

  if (viewMode === 'table') {
    return (
      <tr
        className={cn(
          'hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/80 [&>td]:py-3 [&>td]:px-4',
          isSelected && 'bg-primary/5 hover:bg-primary/10'
        )}
        onClick={handleClick}
      >
        <td className="border-e border-border w-[51px] text-center" onClick={(e) => e.stopPropagation()}>
          <div
            className={cn(
              'w-5 h-5 rounded border border-input flex items-center justify-center cursor-pointer transition-all mx-auto',
              isSelected ? 'bg-primary border-primary text-primary-foreground' : 'hover:border-primary/50'
            )}
            onClick={() => onToggleSelect(product.id)}
          >
            {isSelected && <Check className="h-3 w-3" />}
          </div>
        </td>
        <td className="border-e border-border w-[110px]">
          <Badge variant="outline" className={cn('text-[10px] h-5.5 font-bold uppercase shrink-0', isTurbo ? 'border-amber-500/40 text-amber-500 bg-amber-500/5' : 'border-blue-500/40 text-blue-500 bg-blue-500/5')}>
            {product.category_name || product.loai}
          </Badge>
        </td>
        <td className="border-e border-border w-[130px] font-mono font-bold text-xs text-foreground">
          {product.ma_vt}
        </td>
        <td className="border-e border-border font-bold text-sm text-foreground">
          {displayName}
        </td>
        <td className="border-e border-border w-[140px] text-xs text-muted-foreground hidden xl:table-cell truncate">
          {product.oem_part_no || '—'}
        </td>
        <td className="border-e border-border w-[110px] text-xs text-muted-foreground font-medium truncate">
          {product.hang_may_name || '—'}
        </td>
        <td className="border-e border-border w-[100px] text-xs text-muted-foreground truncate">
          {product.thuong_hieu_name || '—'}
        </td>
        <td className="text-right w-[160px]">
          <div className="flex items-center justify-end gap-2">
            <span className={cn('font-extrabold tabular-nums tracking-tight text-sm', bestPrice.colorClass)}>
              {bestPrice.value ? formatVnd(bestPrice.value) : 'Liên hệ'}
            </span>
            <Badge className={cn('h-5 px-1.5 text-[9px] font-extrabold border shrink-0', bestPrice.badgeClass)}>
              {bestPrice.label}
            </Badge>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col h-full rounded-lg border border-border bg-card cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5 hover:border-primary/40',
        isSelected && 'ring-2 ring-primary border-primary bg-primary/5',
      )}
      onClick={handleClick}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-0.5 rounded-t-lg', bestPrice.barClass)} />

      <div className="relative overflow-hidden rounded-t-lg aspect-[4/3] bg-muted/30">
        {hasImage ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60 gap-1.5">
            <Wrench className="h-10 w-10 opacity-70" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Không có ảnh</span>
          </div>
        )}

        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'flex items-end justify-between p-3',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Badge className={cn('h-6 px-3 text-[11px] font-extrabold border', bestPrice.badgeClass)}>
            {bestPrice.label}
          </Badge>
        </div>

        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
              isSelected
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-black/50 backdrop-blur text-white/80 opacity-0 group-hover:opacity-100',
            )}
            onClick={() => onToggleSelect(product.id)}
          >
            <Check className={cn('h-4 w-4 transition-transform', isSelected ? 'scale-100' : 'scale-75')} />
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-2.5 gap-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono text-[9px] font-bold text-muted-foreground/80 tracking-wide bg-muted px-1.5 py-0.5 rounded">
            {product.ma_vt}
          </span>
          {product.loai === 'ruot' && (
            <Badge variant="outline" className="text-[8.5px] h-4.5 px-1 border-primary/40 text-primary font-bold">
              {'Ruột'}
            </Badge>
          )}
        </div>

        <h4 className="font-bold text-[11.5px] leading-snug line-clamp-2 text-foreground">
          {displayName}
        </h4>

        <div className="space-y-0.5 text-[9.5px] text-muted-foreground">
          {product.hang_may_name && (
            <div className="flex items-center gap-1">
              <Wrench className="h-3 w-3 shrink-0 opacity-70" />
              <span className="truncate font-medium">{product.hang_may_name}</span>
              {product.thuong_hieu_name && (
                <span className="opacity-70">- {product.thuong_hieu_name}</span>
              )}
            </div>
          )}
          {product.ma_dong_co && (
            <div className="truncate font-mono opacity-80 pl-4">Động cơ: {product.ma_dong_co}</div>
          )}
        </div>

        <div className="flex items-end justify-between pt-2 border-t border-border/80 mt-auto">
          <div className="flex flex-col">
            <span className="text-[8.5px] font-bold text-muted-foreground/70 uppercase tracking-wider">{'Đơn Giá'}</span>
            <span className={cn('text-xs font-extrabold tabular-nums tracking-tight', bestPrice.colorClass)}>
              {bestPrice.value ? formatVnd(bestPrice.value) : 'Liên hệ'}
            </span>
          </div>
          <Badge className={cn('h-4.5 px-1.5 text-[8.5px] font-extrabold border shrink-0', bestPrice.badgeClass)}>
            {bestPrice.label}
          </Badge>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1">
          <button
            className={cn(
              "w-full py-1 text-[10px] font-bold rounded-md border transition-colors",
              isSelected 
                ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
                : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect(product.id)
            }}
          >
            {isSelected ? 'Đã chọn' : 'Chọn'}
          </button>
        </div>
      </div>
    </div>
  )
})
