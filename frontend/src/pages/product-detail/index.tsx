import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Wrench,
  Cpu,
  Tag,
  Flame,
  Cog,
  Factory,
  Building2,
  FileText,
  Hash,
  Sheet,
  Calendar,
  ZoomIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useProduct } from '@/pages/search/helper/use-product'
import { useSearchStore } from '@/pages/search/store'
import { cn, formatVnd, shortOem } from '@/lib/utils'
import { COMPANY } from '@/services/config'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const productId = Number(id)
  const { data: product, isLoading, isError } = useProduct(productId)

  const selectedIds = useSearchStore((s) => s.selectedProductIds)
  const toggleProduct = useSearchStore((s) => s.toggleProduct)

  // ALL hooks must be called before any early return
  const [imageError, setImageError] = useState(false)

  if (isNaN(productId)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">ID sản phẩm không hợp lệ</p>
      </div>
    )
  }

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg font-semibold text-destructive">Không tìm thấy sản phẩm</p>
        <Button variant="outline" onClick={() => navigate('/')}>Về trang chủ</Button>
      </div>
    )
  }

  const isSelected = selectedIds.has(product.id)
  const isTurbo = product.loai === 'turbo' || product.loai === 'ruot' || product.loai === 'so_linh_kien_turbo'
  const displayName = product.ten_hang || product.model_turbo || 'Sản phẩm'
  const attrs = product.attributes && Object.keys(product.attributes).length > 0 ? product.attributes : null

  // Build price list
  const prices: Array<{ label: string; value: number | null; variant: string }> = [
    { label: 'Giá vốn', value: product.gia_von ?? null, variant: 'bg-red-50 border-red-200' },
    { label: 'Giá VIP', value: product.gia_vip, variant: 'bg-amber-50 border-amber-200' },
    { label: 'Giá Ưu đãi', value: product.gia_uu_dai, variant: 'bg-blue-50 border-blue-200' },
    { label: 'Giá Đại lý', value: product.gia_dai_ly, variant: 'bg-emerald-50 border-emerald-200' },
    { label: 'Giá Gara', value: product.gia_gara ?? null, variant: 'bg-purple-50 border-purple-200' },
    { label: 'Giá ĐL+10%', value: product.gia_dl_10, variant: 'bg-slate-50 border-slate-200' },
  ]

  // Build tech specs
  const techSpecs: Array<{ label: string; value: string | null }> = [
    { label: 'CG Ø Dưới (mm)', value: product.cg_duoi },
    { label: 'CG Ø Đỉnh (mm)', value: product.cg_dinh },
    { label: 'CG Số', value: product.cg_so || null },
    { label: 'CL Ø Dưới (mm)', value: product.cl_duoi },
    { label: 'CL Ø Đỉnh (mm)', value: product.cl_dinh },
    { label: 'CL Số', value: product.cl_so || null },
  ]
  const hasTechSpecs = techSpecs.some((s) => s.value)

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════ HEADER ═══════ */}
      <header className="bg-gradient-to-r from-turbo-dark via-slate-800 to-turbo-blue text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-xl font-black tracking-tighter">TD</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight cursor-pointer" onClick={() => navigate('/')}>
                {COMPANY.name}
              </h1>
              <p className="text-[10px] text-white/60 leading-tight">{COMPANY.slogan}</p>
            </div>
          </div>

          <Button
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'gap-1.5',
              isSelected
                ? 'bg-white text-turbo-blue hover:bg-white/90'
                : 'border-white/30 text-black hover:bg-white/10 hover:text-white',
            )}
            onClick={() => toggleProduct(product.id)}
          >
            {isSelected ? '✓ Đã chọn' : '+ Chọn vào báo giá'}
          </Button>
        </div>
      </header>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Main info ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Title Card */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* ── Image ── */}
                  <div className="sm:col-span-1">
                    {product.hinh_anh && !imageError ? (
                      <div className="relative group rounded-xl overflow-hidden border bg-muted/30">
                        <img
                          src={product.hinh_anh}
                          alt={product.model_turbo || product.ma_vt}
                          className="w-full aspect-square object-cover"
                          onError={() => setImageError(true)}
                        />
                        <a
                          href={product.hinh_anh}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xem ảnh lớn"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </a>
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                          {isTurbo ? (
                            <Flame className="h-8 w-8 text-turbo-blue/30" />
                          ) : (
                            <Cog className="h-8 w-8 text-turbo-orange/30" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground/60 text-center px-2">
                          {product.hinh_anh ? 'Không tải được ảnh' : 'Chưa có hình ảnh'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── Info ── */}
                  <div className="sm:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={isTurbo ? 'default' : 'outline'}
                          className={cn(
                            'text-xs font-semibold',
                            isTurbo
                              ? 'bg-turbo-blue/10 text-turbo-blue border-turbo-blue/20'
                              : 'bg-turbo-orange/10 text-turbo-orange border-turbo-orange/20',
                          )}
                        >
                          {isTurbo ? (
                            <><Flame className="h-3 w-3 mr-1" /> {product.loai === 'ruot' ? 'Ruột Turbo' : 'Turbo'}</>
                          ) : (
                            <><Cog className="h-3 w-3 mr-1" /> {product.category_name || product.loai}</>
                          )}
                        </Badge>
                        {product.thuong_hieu_name && (
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {product.thuong_hieu_name}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          <Sheet className="h-2.5 w-2.5 mr-1" />
                          {product.sheet_name || '—'}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        ID: {product.id}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      {displayName}
                    </h2>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-mono text-lg font-bold text-primary tracking-wide">
                        {product.ma_vt}
                      </span>
                    </div>

                    {/* Quick info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Thông tin chi tiết
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Đặc điểm
                  </label>
                  <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {product.dac_diem || '—'}
                  </p>
                </div>
                <Separator />
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Ứng dụng
                  </label>
                  <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {product.ung_dung || '—'}
                  </p>
                </div>
                {product.ghi_chu && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Ghi chú
                      </label>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                        {product.ghi_chu}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Kỹ thuật: CG / CL (chỉ turbo) */}
            {isTurbo && hasTechSpecs && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    Thông số kỹ thuật
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {techSpecs.map((spec) =>
                      spec.value ? (
                        <div
                          key={spec.label}
                          className="bg-muted/50 rounded-lg p-3 text-center"
                        >
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                            {spec.label}
                          </div>
                          <div className="font-mono text-sm font-bold text-foreground">
                            {spec.value}
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attributes (non-turbo) */}
            {!isTurbo && attrs && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    Thuộc tính sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(attrs).map(([key, val]) =>
                      val ? (
                        <div
                          key={key}
                          className="bg-muted/50 rounded-lg p-3 text-center"
                        >
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="font-mono text-sm font-bold text-foreground">
                            {String(val)}
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── RIGHT: Pricing sidebar ── */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="sticky top-[90px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Bảng giá</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {prices.map((p) => (
                  <div
                    key={p.label}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      p.variant,
                    )}
                  >
                    <span className="text-xs font-medium text-foreground/80">{p.label}</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatVnd(p.value)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Meta info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thông tin khác</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <MetaRow icon={Hash} label="Mã VT" value={product.ma_vt} mono />
                <MetaRow icon={Sheet} label="Sheet gốc" value={product.sheet_name} />
                <MetaRow
                  icon={Calendar}
                  label="Ngày tạo"
                  value={new Date(product.created_at).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                />
              </CardContent>
            </Card>

            {/* Action */}
            <Button
              className="w-full gap-2"
              size="lg"
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

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | null
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div
          className={cn('text-sm font-medium text-foreground truncate', mono && 'font-mono text-xs')}
          title={value || ''}
        >
          {value || '—'}
        </div>
      </div>
    </div>
  )
}

function InfoRowOem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  if (!value) {
    return (
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="text-sm font-medium text-foreground">—</div>
        </div>
      </div>
    )
  }

  const firstOem = value.trim().split(/[/\s]+/)[0] || value
  const needsTruncate = firstOem.length > 10

  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div
          className={cn(
            'text-sm font-medium font-mono',
            needsTruncate && 'cursor-pointer hover:text-primary underline decoration-dotted underline-offset-2',
            expanded ? 'text-primary' : 'text-foreground',
          )}
          title={needsTruncate ? 'Click để xem đầy đủ' : value}
          onClick={() => needsTruncate && setExpanded(!expanded)}
        >
          {expanded ? value : (needsTruncate ? firstOem.slice(0, 10) + '…' : firstOem)}
        </div>
        {expanded && (
          <div className="mt-2 p-2 rounded-md bg-background border border-border">
            <p className="text-xs text-muted-foreground break-all font-mono leading-relaxed whitespace-pre-line">
              {value}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function MetaRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn('font-medium text-foreground truncate ml-auto', mono && 'font-mono text-[11px]')}>
        {value || '—'}
      </span>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-turbo-dark via-slate-800 to-turbo-blue py-3 px-6">
        <div className="max-w-[1200px] mx-auto flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg bg-white/10" />
          <Skeleton className="h-6 w-40 bg-white/10" />
        </div>
      </header>
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
