import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Wrench, Cpu, Tag, Flame, Cog, Factory, Building2,
  FileText, Hash, Sheet, Calendar, ZoomIn, DollarSign, Ruler,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AppHeader } from '@/components/app-header'
import { useProduct } from '@/pages/search/helper/use-product'
import { useSearchStore } from '@/pages/search/store'
import { getMediaUrl } from '@/lib/media'
import { cn, formatVnd } from '@/lib/utils'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const productId = Number(id)
  const { data: product, isLoading, isError } = useProduct(productId)
  const selectedIds = useSearchStore((s) => s.selectedProductIds)
  const toggleProduct = useSearchStore((s) => s.toggleProduct)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [product?.hinh_anh])

  if (isNaN(productId)) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">ID sản phẩm không hợp lệ</p>
        </div>
      </div>
    )
  }

  if (isLoading) return <DetailSkeleton />
  if (isError || !product) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-lg font-semibold text-destructive">Không tìm thấy sản phẩm</p>
          <Button variant="outline" onClick={() => navigate('/')}>Về trang chủ</Button>
        </div>
      </div>
    )
  }

  const isSelected = selectedIds.has(product.id)
  const isTurbo = product.loai === 'turbo' || product.loai === 'ruot' || product.loai === 'so_linh_kien_turbo'
  const displayName = product.ten_hang || product.model_turbo || 'Sản phẩm'
  const imageUrl = getMediaUrl(product.hinh_anh)
  const attrs = product.attributes && Object.keys(product.attributes).length > 0 ? product.attributes : null

  // ── Price tiers ──
  const prices = [
    { label: 'Giá vốn', value: product.gia_von ?? null, accent: 'border-l-red-500', textColor: 'text-red-600' },
    { label: 'Giá VIP', value: product.gia_vip, accent: 'border-l-amber-500', textColor: 'text-amber-600' },
    { label: 'Giá ưu đãi', value: product.gia_uu_dai, accent: 'border-l-orange-500', textColor: 'text-orange-600' },
    { label: 'Giá đại lý', value: product.gia_dai_ly, accent: 'border-l-blue-500', textColor: 'text-blue-600' },
    { label: 'Giá Gara', value: product.gia_gara ?? null, accent: 'border-l-purple-500', textColor: 'text-purple-600' },
    { label: 'Giá ĐL+10%', value: product.gia_dl_10, accent: 'border-l-slate-500', textColor: 'text-slate-600' },
  ]

  // ── Tech specs ──
  const techSpecs = [
    { label: 'CG Ø Dưới', value: product.cg_duoi, unit: 'mm' },
    { label: 'CG Ø Đỉnh', value: product.cg_dinh, unit: 'mm' },
    { label: 'CG Số', value: product.cg_so || null },
    { label: 'CL Ø Dưới', value: product.cl_duoi, unit: 'mm' },
    { label: 'CL Ø Đỉnh', value: product.cl_dinh, unit: 'mm' },
    { label: 'CL Số', value: product.cl_so || null },
  ]
  const hasTechSpecs = techSpecs.some((s) => s.value)

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ═══════ LEFT: Main info ═══════ */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50 bg-card">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Image */}
                  <div className="sm:col-span-1">
                    {imageUrl && !imageError ? (
                      <div className="relative group rounded-xl overflow-hidden border border-border/30 bg-muted/20">
                        <img
                          src={imageUrl}
                          alt={displayName}
                          className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={() => setImageError(true)}
                        />
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </a>
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-xl border-2 border-dashed border-border/50 bg-muted/10 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                          {isTurbo ? <Flame className="h-8 w-8 text-amber-500/30" /> : <Cog className="h-8 w-8 text-muted-foreground/30" />}
                        </div>
                        <span className="text-xs text-muted-foreground/60">Chưa có hình ảnh</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="sm:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn('text-xs font-semibold', isTurbo ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20')}>
                          {isTurbo ? <><Flame className="h-3 w-3 mr-1" />{product.loai === 'ruot' ? 'Ruột Turbo' : 'Turbo'}</> : <><Cog className="h-3 w-3 mr-1" />{product.category_name || product.loai}</>}
                        </Badge>
                        {product.thuong_hieu_name && (
                          <Badge variant="secondary" className="text-xs">{product.thuong_hieu_name}</Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">ID: {product.id}</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{displayName}</h2>
                    <span className="font-mono text-lg font-bold text-amber-400 tracking-wide">{product.ma_vt}</span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                      <InfoRow icon={Factory} label="Hãng máy" value={product.hang_may_name} />
                      <InfoRow icon={Building2} label="Hãng SX" value={product.hang_sx_name} />
                      <InfoRow icon={Cpu} label="Mã động cơ" value={product.ma_dong_co} />
                      <InfoRowOem icon={Tag} label="OEM Part No" value={product.oem_part_no} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Đặc điểm & Ứng dụng */}
            <Card className="border-border/50 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <FileText className="h-4 w-4 text-amber-400" />
                  Thông tin chi tiết
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đặc điểm</label>
                  <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-line">{product.dac_diem || '—'}</p>
                </div>
                <Separator className="bg-border/50" />
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ứng dụng</label>
                  <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-line">{product.ung_dung || '—'}</p>
                </div>
                {product.ghi_chu && (
                  <>
                    <Separator className="bg-border/50" />
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ghi chú</label>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{product.ghi_chu}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tech specs (turbo only) */}
            {isTurbo && hasTechSpecs && (
              <Card className="border-border/50 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <Ruler className="h-4 w-4 text-amber-400" />
                    Thông số kỹ thuật
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-3">
                    {techSpecs.map((spec) => spec.value ? (
                      <div key={spec.label} className="bg-muted/20 rounded-lg p-3 text-center border border-border/30">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{spec.label}</div>
                        <div className="font-mono text-sm font-bold text-foreground">{spec.value}{spec.unit ? <span className="text-xs text-muted-foreground ml-0.5">{spec.unit}</span> : ''}</div>
                      </div>
                    ) : null)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attributes (non-turbo) */}
            {!isTurbo && attrs && (
              <Card className="border-border/50 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <Wrench className="h-4 w-4 text-amber-400" />
                    Thuộc tính sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(attrs).map(([key, val]) => val ? (
                      <div key={key} className="bg-muted/20 rounded-lg p-3 text-center border border-border/30">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</div>
                        <div className="font-mono text-sm font-bold text-foreground">{String(val)}</div>
                      </div>
                    ) : null)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ═══════ RIGHT: Pricing ═══════ */}
          <div className="space-y-6">
            {/* ── PRICE CARD lung linh ── */}
            <Card className="sticky top-[80px] overflow-hidden border-0 shadow-2xl shadow-amber-500/10">
              {/* Gradient border glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-amber-500/20 via-transparent to-transparent pointer-events-none" />

              {/* Card header */}
              <div className="relative bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 px-5 py-3.5">
                <div className="absolute top-0 right-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
                <h3 className="relative text-base font-bold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-amber-400" />
                  </span>
                  Bảng giá
                </h3>
              </div>

              {/* Price rows với nền trắng + hiệu ứng */}
              <div className="relative bg-white dark:bg-[#1a1d24] px-1 py-2">
                {prices.map((p) => (
                  <div
                    key={p.label}
                    className={cn(
                      'group flex items-center justify-between px-4 py-3.5 mx-1 my-0.5 rounded-xl',
                      'border-l-[3px] transition-all duration-300',
                      'bg-white dark:bg-[#1e2129]',
                      'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5',
                      'hover:border-l-[5px]',
                      p.accent,
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {p.label}
                      </span>
                      {p.value && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {p.label === 'Giá vốn' && 'Giá nhập kho'}
                          {p.label === 'Giá VIP' && 'Khách VIP'}
                          {p.label === 'Giá ưu đãi' && 'Khách ưu đãi'}
                          {p.label === 'Giá đại lý' && 'Khách đại lý'}
                          {p.label === 'Giá Gara' && 'Gara/sửa chữa'}
                          {p.label === 'Giá ĐL+10%' && 'Giá niêm yết'}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      'text-lg font-black tabular-nums tracking-tight',
                      'group-hover:scale-105 transition-transform',
                      p.value
                        ? cn(p.textColor, 'dark:' + p.textColor.replace('600', '400'))
                        : 'text-gray-400 dark:text-gray-500 italic text-sm font-medium',
                    )}>
                      {p.value ? (
                        <span className="flex items-center gap-1">
                          {formatVnd(p.value)}
                          {p.label === 'Giá VIP' && p.value && (
                            <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">Best</span>
                          )}
                        </span>
                      ) : 'Liên hệ'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer glow */}
              <div className="relative bg-slate-900 px-4 py-2.5 text-center">
                <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Giá có thể thay đổi — Liên hệ để có giá tốt nhất
                </p>
              </div>
            </Card>

            {/* Meta info */}
            <Card className="border-border/50 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-foreground">Thông tin khác</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <MetaRow icon={Hash} label="Mã VT" value={product.ma_vt} mono />
                <MetaRow icon={Sheet} label="Sheet gốc" value={product.sheet_name} />
                <MetaRow icon={Calendar} label="Ngày tạo" value={new Date(product.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
              </CardContent>
            </Card>

            {/* Action buttons */}
            <Button
              className="w-full gap-2 h-11 font-semibold text-base"
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => toggleProduct(product.id)}
            >
              {isSelected ? '✓ Bỏ chọn sản phẩm' : '+ Thêm vào danh sách báo giá'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──
function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className={cn('text-sm font-medium text-foreground truncate', mono && 'font-mono text-xs')} title={value || ''}>
          {value || '—'}
        </div>
      </div>
    </div>
  )
}

function InfoRowOem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null }) {
  const [expanded, setExpanded] = useState(false)
  if (!value) return <InfoRow icon={Icon} label={label} value={null} />
  const firstOem = value.trim().split(/[/\s]+/)[0] || value
  const needsTruncate = firstOem.length > 10
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div
          className={cn('text-sm font-medium font-mono', needsTruncate && 'cursor-pointer hover:text-amber-400', expanded ? 'text-amber-400' : 'text-foreground')}
          title={needsTruncate ? 'Click để xem đầy đủ' : value}
          onClick={() => needsTruncate && setExpanded(!expanded)}
        >
          {expanded ? value : (needsTruncate ? firstOem.slice(0, 10) + '…' : firstOem)}
        </div>
        {expanded && (
          <div className="mt-2 p-2 rounded-md bg-background border border-border/50">
            <p className="text-xs text-muted-foreground break-all font-mono leading-relaxed whitespace-pre-line">{value}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MetaRow({ icon: Icon, label, value, mono }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn('font-medium text-foreground truncate ml-auto', mono && 'font-mono text-[11px]')}>{value || '—'}</span>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-6 w-32" /><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-48" /><div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div></CardContent></Card>
            <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-16 w-full" /></CardContent></Card>
          </div>
          <div className="space-y-6">
            <Card><CardContent className="p-6 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</CardContent></Card>
          </div>
        </div>
      </div>
    </div>
  )
}
