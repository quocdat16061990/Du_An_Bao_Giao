import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { getMediaUrl } from '@/lib/media'
import { cn, formatVnd } from '@/lib/utils'
import type { Product } from '../helper/types'
import { Check, Wrench } from 'lucide-react'
import { useSearchStore } from '../store'

interface ProductSpec {
  dvt: string
  soluong: string
  chuthich: string
}

function getProductSpec(product: Product): ProductSpec {
  const dvtRaw = (product.dvt || 'Cái').trim();
  const loai = product.loai || '';
  const catName = (product.category_name || '').toLowerCase();
  const engineCode = (product.ma_dong_co || product.ten_hang || product.model_turbo || '').toUpperCase();

  // 1. Determine number of cylinders from engine code
  let cylinders = 4; // default
  if (engineCode.match(/\b(6[A-Z0-9]?\d*|S6[A-Z0-9]|EM6|N04C|EH700|H07C|J08C|E13C|K13C|6D\d+)\b/)) {
    cylinders = 6;
  } else if (engineCode.includes('6D') || engineCode.includes('6B') || engineCode.includes('6M') || engineCode.includes('S6D') || engineCode.includes('6P') || engineCode.includes('6N') || engineCode.includes('EP100') || engineCode.includes('EF750') || engineCode.includes('F17C') || engineCode.includes('F20C') || engineCode.includes('V22C')) {
    cylinders = 6;
  } else if (engineCode.includes('3D') || engineCode.includes('3T') || engineCode.includes('3N') || engineCode.includes('3L') || engineCode.includes('3S')) {
    cylinders = 3;
  } else if (engineCode.includes('8D') || engineCode.includes('8V') || engineCode.includes('8C') || engineCode.includes('8F')) {
    cylinders = 8;
  }

  // 2. Parse unit and quantity
  let dvt = 'Cái';
  let qtyVal = 1;
  let hasExplicitQty = false;

  const matchQty = dvtRaw.match(/(?:Bộ|Máy|Cặp|Cái)\s*(\d+)/i);
  if (matchQty) {
    qtyVal = parseInt(matchQty[1], 10);
    hasExplicitQty = true;
  }

  if (dvtRaw.toLowerCase().includes('bộ')) {
    dvt = 'Bộ';
    if (!hasExplicitQty) {
      if (loai === 'piston' || loai === 'xy_lanh' || catName.includes('piston') || catName.includes('lanh')) {
        qtyVal = cylinders;
      } else {
        qtyVal = 1;
      }
    }
  } else if (dvtRaw.toLowerCase().includes('máy') || dvtRaw.toLowerCase().includes('1máy')) {
    dvt = 'Máy';
    qtyVal = cylinders;
  } else if (dvtRaw.toLowerCase().includes('cặp')) {
    dvt = 'Cặp';
    qtyVal = 2;
  } else {
    dvt = 'Cái';
    qtyVal = 1;
  }

  // 3. Format description
  let soluong = `${qtyVal} cái`;
  let chuthich = `${qtyVal} chiếc đơn lẻ`;

  const isPiston = loai === 'piston' || catName.includes('piston');
  const isRing = loai === 'sec_mang' || catName.includes('măng');
  const isCylinder = loai === 'xy_lanh' || catName.includes('lanh');

  if (isPiston) {
    soluong = `${qtyVal} quả`;
    chuthich = `Hộp gồm ${qtyVal} quả Piston`;
  } else if (isRing) {
    soluong = `${qtyVal} bộ/máy`;
    chuthich = `Đủ lắp cho ${qtyVal} quả Piston (động cơ ${qtyVal} máy)`;
  } else if (isCylinder) {
    soluong = `${qtyVal} cái/ống`;
    chuthich = `Bộ gồm ${qtyVal} ống xy lanh`;
  } else if (dvt === 'Bộ') {
    soluong = '1 bộ';
    chuthich = 'Trọn bộ chi tiết sản phẩm';
  } else if (dvt === 'Máy') {
    soluong = '1 máy';
    chuthich = `Lắp đủ cho 1 động cơ (${qtyVal} máy)`;
  } else {
    soluong = '1 cái';
    chuthich = '1 cái đơn lẻ';
  }

  // Override if dvt is explicitly "Cái"
  if (dvtRaw.toLowerCase() === 'cái') {
    dvt = 'Cái';
    soluong = '1 cái';
    chuthich = '1 cái đơn lẻ';
  }

  return {
    dvt: dvtRaw,
    soluong,
    chuthich
  };
}


interface ProductCardProps {
  product: Product
  isSelected: boolean
  onToggleSelect: (product: Product) => void
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
  const productQuantities = useSearchStore((s) => s.productQuantities)
  const setProductQuantity = useSearchStore((s) => s.setProductQuantity)

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
            onClick={() => onToggleSelect(product)}
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
        {(() => {
          const spec = getProductSpec(product);
          return (
            <td className="border-e border-border w-[140px] text-xs text-muted-foreground text-center" title={spec.chuthich}>
              <div className="font-bold text-foreground">{spec.dvt}</div>
              <div className="text-[10px] text-muted-foreground/80">({spec.soluong})</div>
            </td>
          );
        })()}
        <td className="border-e border-border w-[110px]" onClick={(e) => e.stopPropagation()}>
          {isSelected ? (
            <div className="flex items-center justify-between border border-input rounded-md overflow-hidden bg-background h-7 max-w-[90px] mx-auto">
              <button
                type="button"
                className="w-6 h-full flex items-center justify-center hover:bg-muted text-foreground font-bold text-xs"
                onClick={() => {
                  const currentQty = productQuantities[product.id] ?? 1;
                  if (currentQty > 1) {
                    setProductQuantity(product.id, currentQty - 1);
                  } else {
                    onToggleSelect(product);
                  }
                }}
              >
                -
              </button>
              <div className="flex-1 text-center font-bold text-xs font-mono select-none">
                {productQuantities[product.id] ?? 1}
              </div>
              <button
                type="button"
                className="w-6 h-full flex items-center justify-center hover:bg-muted text-foreground font-bold text-xs"
                onClick={() => {
                  const currentQty = productQuantities[product.id] ?? 1;
                  setProductQuantity(product.id, currentQty + 1);
                }}
              >
                +
              </button>
            </div>
          ) : (
            <div className="text-center text-xs text-muted-foreground opacity-40 select-none">—</div>
          )}
        </td>
        <td className="border-e border-border text-right w-[110px]">
          <span className="font-bold tabular-nums tracking-tight text-xs text-red-600 dark:text-red-400">
            {product.gia_von ? formatVnd(product.gia_von) : 'Liên hệ'}
          </span>
        </td>
        <td className="border-e border-border text-right w-[110px]">
          <span className="font-bold tabular-nums tracking-tight text-xs text-amber-600 dark:text-amber-400">
            {product.gia_vip ? formatVnd(product.gia_vip) : 'Liên hệ'}
          </span>
        </td>
        <td className="border-e border-border text-right w-[110px]">
          <span className="font-bold tabular-nums tracking-tight text-xs text-orange-600 dark:text-orange-400">
            {product.gia_uu_dai ? formatVnd(product.gia_uu_dai) : 'Liên hệ'}
          </span>
        </td>
        <td className="border-e border-border text-right w-[110px]">
          <span className="font-bold tabular-nums tracking-tight text-xs text-blue-600 dark:text-blue-400">
            {product.gia_dai_ly ? formatVnd(product.gia_dai_ly) : 'Liên hệ'}
          </span>
        </td>
        <td className="border-e border-border text-right w-[110px]">
          <span className="font-bold tabular-nums tracking-tight text-xs text-purple-600 dark:text-purple-400">
            {product.gia_gara ? formatVnd(product.gia_gara) : 'Liên hệ'}
          </span>
        </td>
        <td className="text-right w-[120px]">
          <span className="font-bold tabular-nums tracking-tight text-xs text-slate-600 dark:text-slate-400">
            {product.gia_dl_10 ? formatVnd(product.gia_dl_10) : 'Liên hệ'}
          </span>
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
            onClick={() => onToggleSelect(product)}
          >
            <Check className={cn('h-4 w-4 transition-transform', isSelected ? 'scale-100' : 'scale-75')} />
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-2.5 gap-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[9px] font-bold text-muted-foreground/80 tracking-wide bg-muted px-1.5 py-0.5 rounded shrink-0">
              {product.ma_vt}
            </span>
            {product.dvt && (
              <span className="text-[9px] font-bold text-turbo-blue/80 bg-turbo-blue/5 border border-turbo-blue/15 px-1 py-0.5 rounded capitalize truncate max-w-[65px]" title={product.dvt}>
                {product.dvt}
              </span>
            )}
          </div>
          {product.loai === 'ruot' && (
            <Badge variant="outline" className="text-[8.5px] h-4.5 px-1 border-primary/40 text-primary font-bold shrink-0">
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
          {(() => {
            const spec = getProductSpec(product);
            return (
              <div className="mt-1.5 pt-1.5 border-t border-border/60 space-y-0.5 text-[9.5px]">
                <div className="flex items-center justify-between text-foreground/85">
                  <span>Đơn vị: <span className="font-bold text-turbo-blue">{spec.dvt}</span></span>
                  <span>Quy cách: <span className="font-bold text-turbo-blue">{spec.soluong}</span></span>
                </div>
                <div className="text-[9px] text-muted-foreground/80 italic truncate" title={spec.chuthich}>
                  ({spec.chuthich})
                </div>
              </div>
            );
          })()}
        </div>

        <div className="pt-2 border-t border-border/80 mt-auto">
          <div className="grid grid-cols-2 gap-x-1.5 gap-y-1 text-[9.5px]">
            <div className="flex justify-between items-center bg-red-500/5 dark:bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/15">
              <span className="text-muted-foreground font-semibold">Vốn:</span>
              <span className="font-bold tabular-nums text-red-600 dark:text-red-400">
                {product.gia_von ? formatVnd(product.gia_von) : 'L.Hệ'}
              </span>
            </div>
            <div className="flex justify-between items-center bg-amber-500/5 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15">
              <span className="text-muted-foreground font-semibold">VIP:</span>
              <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {product.gia_vip ? formatVnd(product.gia_vip) : 'L.Hệ'}
              </span>
            </div>
            <div className="flex justify-between items-center bg-orange-500/5 dark:bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/15">
              <span className="text-muted-foreground font-semibold">U.Đãi:</span>
              <span className="font-bold tabular-nums text-orange-600 dark:text-orange-400">
                {product.gia_uu_dai ? formatVnd(product.gia_uu_dai) : 'L.Hệ'}
              </span>
            </div>
            <div className="flex justify-between items-center bg-blue-500/5 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/15">
              <span className="text-muted-foreground font-semibold">Đ.Lý:</span>
              <span className="font-bold tabular-nums text-blue-600 dark:text-blue-400">
                {product.gia_dai_ly ? formatVnd(product.gia_dai_ly) : 'L.Hệ'}
              </span>
            </div>
            <div className="flex justify-between items-center bg-purple-500/5 dark:bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/15">
              <span className="text-muted-foreground font-semibold">Gara:</span>
              <span className="font-bold tabular-nums text-purple-600 dark:text-purple-400">
                {product.gia_gara ? formatVnd(product.gia_gara) : 'L.Hệ'}
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-500/5 dark:bg-slate-500/10 px-1.5 py-0.5 rounded border border-slate-500/15">
              <span className="text-muted-foreground font-semibold">ĐL+10%:</span>
              <span className="font-bold tabular-nums text-slate-600 dark:text-slate-400">
                {product.gia_dl_10 ? formatVnd(product.gia_dl_10) : 'L.Hệ'}
              </span>
            </div>
          </div>
        </div>

        <div className={cn("mt-1.5 transition-all duration-200", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
          {isSelected ? (
            <div className="flex items-center justify-between border border-primary/30 rounded-md overflow-hidden bg-primary/5 h-7" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="w-8 h-full flex items-center justify-center hover:bg-primary/10 text-primary font-bold transition-colors text-xs"
                onClick={() => {
                  const currentQty = productQuantities[product.id] ?? 1;
                  if (currentQty > 1) {
                    setProductQuantity(product.id, currentQty - 1);
                  } else {
                    onToggleSelect(product);
                  }
                }}
              >
                -
              </button>
              <div className="flex-1 text-center font-bold text-xs text-primary font-mono select-none">
                SL: {productQuantities[product.id] ?? 1}
              </div>
              <button
                type="button"
                className="w-8 h-full flex items-center justify-center hover:bg-primary/10 text-primary font-bold transition-colors text-xs"
                onClick={() => {
                  const currentQty = productQuantities[product.id] ?? 1;
                  setProductQuantity(product.id, currentQty + 1);
                }}
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="w-full py-1 text-[10px] font-bold rounded-md border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect(product)
              }}
            >
              Chọn
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
