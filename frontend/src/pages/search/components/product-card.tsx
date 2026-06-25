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
        label: '\u01afu \u0111\u00e3i',
        colorClass: 'price-uu-dai',
        badgeClass: 'bg-orange-600 border-orange-700 text-white shadow-sm',
        barClass: 'bg-orange-600',
      }
    }

    if (product.gia_dai_ly) {
      return {
        value: product.gia_dai_ly,
        label: '\u0110\u1ea1i l\u00fd',
        colorClass: 'price-dai-ly',
        badgeClass: 'bg-sky-700 border-sky-800 text-white shadow-sm',
        barClass: 'bg-sky-700',
      }
    }

    return {
      value: product.gia_dl_10,
      label: '\u0110L+10%',
      colorClass: 'price-dl10',
      badgeClass: 'bg-teal-700 border-teal-800 text-white shadow-sm',
      barClass: 'bg-teal-700',
    }
  }

  const bestPrice = getBestPrice()
  const displayName = product.ten_hang || product.model_turbo || product.ma_vt
  const imageUrl = getMediaUrl(product.hinh_anh)
  const hasImage = imageUrl && !imgError

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-lg border border-slate-300 bg-card cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-900/10 hover:border-primary/40',
        isSelected && 'ring-2 ring-primary border-primary bg-primary/5',
      )}
      onClick={handleClick}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-1 rounded-t-lg', bestPrice.barClass)} />

      <div className="relative overflow-hidden rounded-t-lg aspect-[4/3] bg-slate-100">
        {hasImage ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
            <Wrench className="h-11 w-11" />
            <span className="text-[10px] font-bold uppercase tracking-wider">No Image</span>
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

      <div className="flex flex-col flex-1 p-3.5 gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-bold text-slate-500 tracking-wide">
            {product.ma_vt}
          </span>
          {product.loai === 'ruot' && (
            <Badge variant="outline" className="text-[10px] h-5 border-primary/50 text-primary font-bold">
              {'Ru\u1ed9t'}
            </Badge>
          )}
        </div>

        <h4 className="font-semibold text-[13px] leading-snug line-clamp-2 flex-1 text-slate-900">
          {displayName}
        </h4>

        <div className="space-y-1 text-[11px] text-slate-500">
          {product.hang_may_name && (
            <div className="flex items-center gap-1.5">
              <Wrench className="h-3 w-3 shrink-0 opacity-70" />
              <span className="truncate">{product.hang_may_name}</span>
              {product.thuong_hieu_name && (
                <span className="opacity-70">- {product.thuong_hieu_name}</span>
              )}
            </div>
          )}
          {product.ma_dong_co && (
            <div className="truncate opacity-90">{product.ma_dong_co}</div>
          )}
        </div>

        <div className="flex items-end justify-between pt-2.5 border-t border-slate-200">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">{'Gi\u00e1'}</span>
            <span className={cn('text-lg font-extrabold tabular-nums tracking-tight', bestPrice.colorClass)}>
              {bestPrice.value ? formatVnd(bestPrice.value) : 'Li\u00ean h\u1ec7'}
            </span>
          </div>
          <Badge className={cn('h-6 px-3 text-[11px] font-extrabold border', bestPrice.badgeClass)}>
            {bestPrice.label}
          </Badge>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-1">
          <button
            className="w-full py-1.5 text-xs font-bold rounded-md border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect(product.id)
            }}
          >
            {isSelected ? '\u0110\u00e3 ch\u1ecdn' : 'Ch\u1ecdn SP'}
          </button>
        </div>
      </div>
    </div>
  )
})
