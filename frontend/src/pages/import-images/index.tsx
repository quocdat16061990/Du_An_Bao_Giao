import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckSquare,
  Database,
  Image as ImageIcon,
  Images,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'

import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/lib/api/client'
import { getMediaUrl } from '@/lib/media'
import { useAuth } from '@/lib/auth/context'
import { cn } from '@/lib/utils'

type ImageRowStatus =
  | 'SAFE'
  | 'UNMATCHED'
  | 'MULTIPLE_MATCH'
  | 'HAS_IMAGE'
  | 'LOAI_MISMATCH'
  | 'UNSUPPORTED'
  | 'URL_TOO_LONG'

interface ImageMatchProduct {
  id: number
  ma_vt: string
  loai: string
  ten_hang: string
  model_turbo: string
  ma_dong_co: string
  oem_part_no: string
  parno: string
  hinh_anh: string
  danh_sach_hinh_anh: Array<string>
  category_name: string
  hang_may_name: string
  hang_sx_name: string
  thuong_hieu_name: string
  match_method: 'MA_VT' | 'OEM_PART_NO'
  matched_token: string
  confidence: number
  has_image: boolean
  loai_mismatch: boolean
}

interface ImageImportRow {
  row_id: string
  source_key: 'ruot' | 'turbo'
  source_label: string
  expected_loai: string
  file_name: string
  relative_path: string
  media_path: string
  media_url: string
  extension: string
  media_type: 'image' | 'video'
  size: number
  modified_at: number
  status: ImageRowStatus
  safe_to_sync: boolean
  candidates: Array<string>
  matches: Array<ImageMatchProduct>
  match_count: number
}

interface ImageImportPreviewResponse {
  summary: {
    total_files: number
    media_files: number
    image_files: number
    video_files: number
    unsupported_files: number
    matched_files: number
    unmatched_files: number
    multiple_match_files: number
    has_image_files: number
    loai_mismatch_files: number
    safe_to_sync: number
    url_too_long_files: number
    by_source: Record<string, Record<string, number | string | boolean>>
  }
  rows: Array<ImageImportRow>
}

interface ImageImportSyncResponse {
  summary: {
    total: number
    updated: number
    skipped: number
  }
  results: Array<{
    row_id: string
    product_id: number
    status: 'UPDATED' | 'SKIPPED'
    reason: string
    old_image?: string
    new_image?: string
    ma_vt?: string
  }>
}

const numberFmt = new Intl.NumberFormat('vi-VN')
const PAGE_SIZE_OPTIONS = [30, 60, 100, 200]
const MAX_SYNC_ITEMS = 200

function fm(value: number) {
  return numberFmt.format(value)
}

function formatBytes(value: number) {
  if (!Number.isFinite(value)) return '-'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(timestamp: number) {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString('vi-VN')
}

function statusMeta(status: ImageRowStatus) {
  switch (status) {
    case 'SAFE':
      return { label: 'An toàn', className: 'border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]' }
    case 'UNMATCHED':
      return { label: 'Chưa match', className: 'border-[#00bad1]/30 bg-[#00bad1]/10 text-[#00bad1]' }
    case 'MULTIPLE_MATCH':
      return { label: 'Nhiều DB', className: 'border-[#ff9f43]/30 bg-[#ff9f43]/10 text-[#ff9f43]' }
    case 'HAS_IMAGE':
      return { label: 'Đã có ảnh', className: 'border-border/70 bg-muted/40 text-muted-foreground' }
    case 'LOAI_MISMATCH':
      return { label: 'Khác loại', className: 'border-[#ff9f43]/30 bg-[#ff9f43]/10 text-[#ff9f43]' }
    case 'URL_TOO_LONG':
      return { label: 'Path dài', className: 'border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]' }
    default:
      return { label: 'Không hỗ trợ', className: 'border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]' }
  }
}

function methodLabel(method?: string) {
  if (method === 'MA_VT') return 'Mã VT'
  if (method === 'OEM_PART_NO') return 'OEM/Part No'
  return '-'
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardContent className="p-3.5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-2xl font-extrabold leading-tight tabular-nums text-foreground">
          {typeof value === 'number' ? fm(value) : value}
        </div>
      </CardContent>
    </Card>
  )
}

function ProductMatchCell({
  row,
  selectedProductId,
  onProductChange,
}: {
  row: ImageImportRow
  selectedProductId?: number
  onProductChange: (productId: number) => void
}) {
  if (row.matches.length === 0) {
    return <div className="text-xs text-muted-foreground">Không tìm thấy sản phẩm phù hợp.</div>
  }

  const selected = row.matches.find((match) => match.id === selectedProductId) ?? row.matches[0]

  return (
    <div className="space-y-2">
      {row.matches.length > 1 && (
        <Select value={String(selected.id)} onValueChange={(value) => onProductChange(Number(value))}>
          <SelectTrigger className="h-8 max-w-[300px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {row.matches.map((match) => (
              <SelectItem key={match.id} value={String(match.id)}>
                #{match.id} {match.ma_vt} - {match.loai}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="rounded-md border border-border/50 bg-background/70 p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11px] text-muted-foreground">#{selected.id}</span>
          <Badge variant="outline" className="h-5 px-2 text-[10px]">
            {selected.loai}
          </Badge>
          <span className="font-semibold text-foreground">{selected.ma_vt}</span>
          <Badge variant="secondary" className="h-5 px-2 text-[10px]">
            {methodLabel(selected.match_method)}
          </Badge>
        </div>
        <div className="mt-1 max-w-[420px] truncate text-xs text-foreground" title={selected.ten_hang || selected.model_turbo}>
          {selected.ten_hang || selected.model_turbo || '-'}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>Token: <span className="font-mono text-foreground">{selected.matched_token}</span></span>
          <span>Hãng: <span className="text-foreground">{selected.hang_may_name || '-'}</span></span>
          <span>TH: <span className="text-foreground">{selected.thuong_hieu_name || '-'}</span></span>
          {selected.has_image && <span className="text-[#ff9f43]">DB đã có ảnh</span>}
          {selected.loai_mismatch && <span className="text-[#ff9f43]">Khác loại kho</span>}
        </div>
      </div>
    </div>
  )
}

function PreviewThumb({ row }: { row: ImageImportRow }) {
  if (row.media_type === 'video') {
    return (
      <div className="flex h-20 w-24 items-center justify-center rounded-md border border-border/60 bg-muted/30">
        <Video className="h-6 w-6 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-20 w-24 overflow-hidden rounded-md border border-border/60 bg-muted/30">
      <img
        src={getMediaUrl(row.media_url)}
        alt={row.file_name}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}

export default function ImportImagesPage() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(60)
  const [currentPage, setCurrentPage] = useState(1)
  const [overwrite, setOverwrite] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [productChoice, setProductChoice] = useState<Record<string, number>>({})
  const [syncResult, setSyncResult] = useState<ImageImportSyncResponse | null>(null)
  const [syncedRowIds, setSyncedRowIds] = useState<Set<string>>(new Set())

  const scanQuery = useQuery({
    queryKey: ['product-image-import-scan'],
    queryFn: () => apiClient.get<ImageImportPreviewResponse>('/imports/images/scan/').then(({ data }) => data),
    staleTime: 30_000,
  })

  const syncMutation = useMutation({
    mutationFn: (payload: { items: Array<{ row_id: string; product_id: number }>; overwrite: boolean }) =>
      apiClient.post<ImageImportSyncResponse>('/imports/images/sync/', payload, { timeout: 120_000 }).then(({ data }) => data),
    onSuccess: (data) => {
      const updatedRowIds = data.results
        .filter((result) => result.status === 'UPDATED')
        .map((result) => result.row_id)

      if (updatedRowIds.length > 0) {
        setSyncedRowIds((current) => {
          const next = new Set(current)
          updatedRowIds.forEach((rowId) => next.add(rowId))
          return next
        })

        queryClient.setQueryData<ImageImportPreviewResponse>(['product-image-import-scan'], (current) => {
          if (!current) return current

          return {
            ...current,
            rows: current.rows.map((row) => (
              updatedRowIds.includes(row.row_id)
                ? { ...row, status: 'HAS_IMAGE', safe_to_sync: false }
                : row
            )),
          }
        })
      }

      setSyncResult(data)
      setSelectedRows(new Set())
      toast.success(`Đã đồng bộ ${fm(data.summary.updated)} ảnh`)
      scanQuery.refetch().then(({ data: freshData }) => {
        if (!freshData) return

        setSyncedRowIds((current) => {
          const visibleSyncedRows = freshData.rows
            .filter((row) => current.has(row.row_id) && row.status !== 'HAS_IMAGE')
            .map((row) => row.row_id)
          return new Set(visibleSyncedRows)
        })
      })
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error ?? 'Không thể đồng bộ ảnh'
      toast.error(message)
    },
  })

  const rows = scanQuery.data?.rows ?? []
  const filteredRows = useMemo(() => {
    const query = search.trim().toUpperCase()
    return rows.filter((row) => {
      if (syncedRowIds.has(row.row_id)) return false

      // Không hiển thị các tệp chưa khớp (UNMATCHED)
      if (row.status === 'UNMATCHED') return false

      // Không hiển thị các tệp đã có ảnh này rồi (HAS_IMAGE)
      if (row.status === 'HAS_IMAGE') return false

      if (sourceFilter !== 'all' && row.source_key !== sourceFilter) return false
      if (statusFilter === 'safe' && !row.safe_to_sync) return false
      if (statusFilter !== 'all' && statusFilter !== 'safe' && row.status !== statusFilter) return false
      if (!query) return true

      const haystack = [
        row.file_name,
        row.relative_path,
        row.candidates.join(' '),
        row.matches.map((match) => `${match.ma_vt} ${match.ten_hang} ${match.model_turbo} ${match.oem_part_no} ${match.parno}`).join(' '),
      ].join(' ').toUpperCase()
      return haystack.includes(query)
    })
  }, [rows, search, sourceFilter, statusFilter, syncedRowIds])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const selectedItems = useMemo(() => {
    return rows
      .filter((row) => selectedRows.has(row.row_id))
      .map((row) => ({
        row,
        productId: productChoice[row.row_id] ?? row.matches[0]?.id,
      }))
      .filter((item): item is { row: ImageImportRow; productId: number } => Boolean(item.productId))
  }, [productChoice, rows, selectedRows])

  const canSync = isAuthenticated
    && selectedItems.length > 0
    && selectedItems.length <= MAX_SYNC_ITEMS
    && !syncMutation.isPending

  const handleSelectRow = (row: ImageImportRow, checked: boolean) => {
    const next = new Set(selectedRows)
    if (checked) {
      next.add(row.row_id)
      setProductChoice((current) => ({
        ...current,
        [row.row_id]: current[row.row_id] ?? row.matches[0]?.id,
      }))
    } else {
      next.delete(row.row_id)
    }
    setSelectedRows(next)
    setSyncResult(null)
  }

  const handleSelectSafePage = () => {
    const next = new Set(selectedRows)
    const nextChoices = { ...productChoice }
    paginatedRows.forEach((row) => {
      if (!row.safe_to_sync || !row.matches[0]) return
      next.add(row.row_id)
      nextChoices[row.row_id] = row.matches[0].id
    })
    setSelectedRows(next)
    setProductChoice(nextChoices)
    setSyncResult(null)
  }

  const handleProductChange = (row: ImageImportRow, productId: number) => {
    setProductChoice((current) => ({ ...current, [row.row_id]: productId }))
  }

  const handleSync = () => {
    if (!canSync) return
    syncMutation.mutate({
      overwrite,
      items: selectedItems.map((item) => ({
        row_id: item.row.row_id,
        product_id: item.productId,
      })),
    })
  }

  const headerStats = scanQuery.data ? (
    <div className="text-right text-sm">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Kho ảnh</div>
      <div className="font-bold tabular-nums text-foreground">
        {fm(scanQuery.data.summary.image_files)} ảnh
      </div>
    </div>
  ) : null

  return (
    <div className="min-h-screen bg-background">
      <AppHeader stats={headerStats} />

      <main className="mx-auto max-w-[1700px] space-y-4 px-4 py-4 md:px-6">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <Images className="h-5 w-5 shrink-0 text-[#00bad1]" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Import ảnh sản phẩm</p>
                <p className="truncate text-xs text-muted-foreground">
                  Scan 2 kho ảnh trong media/products, preview match trước khi ghi DB.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => scanQuery.refetch()}
                disabled={scanQuery.isFetching}
              >
                {scanQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Scan lại
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={!canSync}
                onClick={handleSync}
              >
                {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Đồng bộ ảnh
              </Button>
            </div>
          </CardContent>
        </Card>

        {!isAuthenticated && (
          <div className="rounded-lg border border-[#ff9f43]/30 bg-[#ff9f43]/10 px-4 py-3 text-sm text-[#ff9f43]">
            Cần đăng nhập để đồng bộ ảnh vào DB. Bạn vẫn có thể xem preview.
          </div>
        )}

        {scanQuery.data && (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
              <SummaryTile label="Tổng media" value={scanQuery.data.summary.media_files} />
              <SummaryTile label="Ảnh" value={scanQuery.data.summary.image_files} />
              <SummaryTile label="Match DB" value={scanQuery.data.summary.matched_files} />
              <SummaryTile label="An toàn sync" value={scanQuery.data.summary.safe_to_sync} />
              <SummaryTile label="Nhiều DB" value={scanQuery.data.summary.multiple_match_files} />
              <SummaryTile label="Chưa match" value={scanQuery.data.summary.unmatched_files} />
            </div>

            <Card className="border-border/60 bg-card shadow-sm">
              <CardContent className="space-y-3 p-3.5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <div className="relative min-w-[260px] flex-1 xl:max-w-[420px]">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        value={search}
                        onChange={(event) => {
                          setSearch(event.target.value)
                          setCurrentPage(1)
                        }}
                        placeholder="Tìm tên file, mã VT, OEM, model..."
                        className="h-9 w-full rounded-md border border-border/70 bg-background pl-9 pr-3 text-sm outline-none focus:border-primary/60"
                      />
                    </div>
                    <Select value={sourceFilter} onValueChange={(value) => { setSourceFilter(value); setCurrentPage(1) }}>
                      <SelectTrigger className="h-9 w-[170px] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả kho</SelectItem>
                        <SelectItem value="turbo">Kho Turbo</SelectItem>
                        <SelectItem value="ruot">Kho Ruột</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1) }}>
                      <SelectTrigger className="h-9 w-[185px] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="safe">An toàn sync</SelectItem>
                        <SelectItem value="MULTIPLE_MATCH">Nhiều DB</SelectItem>
                        <SelectItem value="LOAI_MISMATCH">Khác loại</SelectItem>
                        <SelectItem value="UNSUPPORTED">Không hỗ trợ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleSelectSafePage}>
                      <CheckSquare className="h-4 w-4" />
                      Chọn an toàn trang này
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRows(new Set())
                        setSyncResult(null)
                      }}
                    >
                      Bỏ chọn
                    </Button>
                    <label className="flex h-9 items-center gap-2 rounded-md border border-border/70 px-3 text-xs text-muted-foreground">
                      <Checkbox checked={overwrite} onCheckedChange={(checked) => setOverwrite(checked === true)} />
                      Ghi đè ảnh cũ
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <div>
                    Đang lọc <span className="font-semibold text-foreground">{fm(filteredRows.length)}</span> dòng,
                    đã chọn <span className="font-semibold text-foreground">{fm(selectedRows.size)}</span> dòng.
                    {selectedRows.size > MAX_SYNC_ITEMS && (
                      <span className="ml-2 text-[#ff4c51]">Tối đa {MAX_SYNC_ITEMS} ảnh mỗi lần sync.</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>/ trang</span>
                    <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setCurrentPage(1) }}>
                      <SelectTrigger className="h-8 w-[82px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <SelectItem key={size} value={String(size)}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {syncResult && (
              <div className="flex flex-wrap gap-2 rounded-lg border border-border/60 bg-card px-4 py-3 text-xs">
                <Badge className="border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]">
                  Đã cập nhật: {fm(syncResult.summary.updated)}
                </Badge>
                <Badge className="border-[#ff9f43]/30 bg-[#ff9f43]/10 text-[#ff9f43]">
                  Bỏ qua: {fm(syncResult.summary.skipped)}
                </Badge>
                {syncResult.results.slice(0, 6).map((result) => (
                  <Badge key={`${result.row_id}-${result.product_id}`} variant="secondary" className="max-w-[380px] truncate">
                    {result.status === 'UPDATED' ? result.ma_vt : result.reason}
                  </Badge>
                ))}
              </div>
            )}

            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  Preview match ảnh
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  Trang {fm(safePage)} / {fm(totalPages)}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[760px] overflow-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-20 bg-card">
                      <tr>
                        <th className="w-[52px] border-b border-r border-border/70 px-3 py-2 text-center font-semibold text-muted-foreground">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={
                                paginatedRows.length > 0 &&
                                paginatedRows
                                  .filter((r) => r.media_type === 'image' && r.matches.length > 0 && r.status !== 'URL_TOO_LONG')
                                  .length > 0 &&
                                paginatedRows
                                  .filter((r) => r.media_type === 'image' && r.matches.length > 0 && r.status !== 'URL_TOO_LONG')
                                  .every((r) => selectedRows.has(r.row_id))
                              }
                              onCheckedChange={(checked) => {
                                const next = new Set(selectedRows)
                                const nextChoices = { ...productChoice }
                                paginatedRows.forEach((row) => {
                                  const canSelect = row.media_type === 'image' && row.matches.length > 0 && row.status !== 'URL_TOO_LONG'
                                  if (!canSelect) return
                                  if (checked === true) {
                                    next.add(row.row_id)
                                    nextChoices[row.row_id] = nextChoices[row.row_id] ?? row.matches[0]?.id
                                  } else {
                                    next.delete(row.row_id)
                                  }
                                })
                                setSelectedRows(next)
                                setProductChoice(nextChoices)
                                setSyncResult(null)
                              }}
                              aria-label="Chọn tất cả trang này"
                            />
                          </div>
                        </th>
                        <th className="min-w-[120px] border-b border-r border-border/70 px-3 py-2 text-left font-semibold text-muted-foreground">
                          Ảnh
                        </th>
                        <th className="min-w-[340px] border-b border-r border-border/70 px-3 py-2 text-left font-semibold text-foreground">
                          File trong kho
                        </th>
                        <th className="min-w-[145px] border-b border-r border-border/70 px-3 py-2 text-left font-semibold text-muted-foreground">
                          Trạng thái
                        </th>
                        <th className="min-w-[430px] border-b border-r border-border/70 px-3 py-2 text-left font-semibold text-foreground">
                          Sản phẩm DB match
                        </th>
                        <th className="min-w-[180px] border-b border-border/70 px-3 py-2 text-left font-semibold text-muted-foreground">
                          Ảnh hiện tại
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row) => {
                        const meta = statusMeta(row.status)
                        const selected = selectedRows.has(row.row_id)
                        const selectedProductId = productChoice[row.row_id] ?? row.matches[0]?.id
                        const canSelect = row.media_type === 'image' && row.matches.length > 0 && row.status !== 'URL_TOO_LONG'
                        const chosenMatch = row.matches.find((match) => match.id === selectedProductId) ?? row.matches[0]

                        return (
                          <tr
                            key={row.row_id}
                            className={cn(
                              'border-b border-border/40 hover:bg-muted/30',
                              selected && 'bg-primary/5',
                            )}
                          >
                            <td className="border-r border-border/60 px-3 py-2 text-center align-top">
                              <Checkbox
                                checked={selected}
                                disabled={!canSelect}
                                onCheckedChange={(checked) => handleSelectRow(row, checked === true)}
                                aria-label={`Chọn ${row.file_name}`}
                              />
                            </td>
                            <td className="border-r border-border/40 px-3 py-2 align-top">
                              <PreviewThumb row={row} />
                            </td>
                            <td className="border-r border-border/40 px-3 py-2 align-top">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className="h-5 px-2 text-[10px]">
                                  {row.source_key === 'turbo' ? 'Turbo' : 'Ruột'}
                                </Badge>
                                {row.media_type === 'image' ? (
                                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Video className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span className="font-semibold text-foreground">{row.file_name}</span>
                              </div>
                              <div className="mt-1 max-w-[520px] break-words font-mono text-[11px] text-muted-foreground">
                                {row.relative_path}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                <span>{formatBytes(row.size)}</span>
                                <span>{formatDate(row.modified_at)}</span>
                              </div>
                            </td>
                            <td className="border-r border-border/40 px-3 py-2 align-top">
                              <Badge className={cn('border text-[10px]', meta.className)}>
                                {meta.label}
                              </Badge>
                              {row.status === 'MULTIPLE_MATCH' && (
                                <div className="mt-1 flex items-start gap-1 text-[11px] text-[#ff9f43]">
                                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                  Cần chọn đúng sản phẩm.
                                </div>
                              )}
                            </td>
                            <td className="border-r border-border/40 px-3 py-2 align-top">
                              <ProductMatchCell
                                row={row}
                                selectedProductId={selectedProductId}
                                onProductChange={(productId) => handleProductChange(row, productId)}
                              />
                            </td>
                            <td className="px-3 py-2 align-top">
                              {chosenMatch?.hinh_anh ? (
                                <div className="space-y-1">
                                  <div className="h-14 w-20 overflow-hidden rounded-md border border-border/60 bg-muted/30">
                                    <img
                                      src={getMediaUrl(chosenMatch.hinh_anh)}
                                      alt={chosenMatch.ma_vt}
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                      onError={(event) => {
                                        event.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                  <div className="max-w-[220px] truncate font-mono text-[10px] text-muted-foreground" title={chosenMatch.hinh_anh}>
                                    {chosenMatch.hinh_anh}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Chưa có</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{fm((safePage - 1) * pageSize + 1)}</span>
                    {' - '}
                    <span className="font-semibold text-foreground">{fm(Math.min(safePage * pageSize, filteredRows.length))}</span>
                    {' / '}
                    <span className="font-semibold text-foreground">{fm(filteredRows.length)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setCurrentPage(1)}>
                      Đầu
                    </Button>
                    <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}>
                      Trước
                    </Button>
                    <span className="min-w-[90px] text-center text-sm font-semibold tabular-nums">
                      {fm(safePage)} / {fm(totalPages)}
                    </span>
                    <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>
                      Sau
                    </Button>
                    <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setCurrentPage(totalPages)}>
                      Cuối
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {scanQuery.isLoading && (
          <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-border/60 bg-card text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang scan kho ảnh...
          </div>
        )}

        {scanQuery.isError && (
          <div className="rounded-lg border border-[#ff4c51]/30 bg-[#ff4c51]/10 px-4 py-3 text-sm text-[#ff4c51]">
            Không thể scan kho ảnh.
          </div>
        )}
      </main>
    </div>
  )
}
