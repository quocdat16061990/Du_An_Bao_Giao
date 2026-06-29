import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Database,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Save,
  Upload,
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
import { useAuth } from '@/lib/auth/context'
import { cn } from '@/lib/utils'
import { AxiosError } from 'axios'

interface WorkbookColumn {
  index: number
  key: string
  label: string
}

interface WorkbookRow {
  row_number: number
  values: Array<string>
}

interface WorkbookSheet {
  sheet_name: string
  row_count: number
  column_count: number
  columns: Array<WorkbookColumn>
  rows: Array<WorkbookRow>
}

interface WorkbookPreviewResponse {
  file_name: string
  summary: {
    sheet_count: number
    total_rows: number
    max_columns: number
  }
  sheets: Array<WorkbookSheet>
}

type DbCheckStatus = 'EXISTS' | 'NEW' | 'MISSING_CODE' | 'DUPLICATE_EXCEL' | 'MULTIPLE_DB'

interface DbCheckProduct {
  id: number
  ma_vt: string
  loai: string
  loai_display: string
  ten_hang: string
  dvt: string
  doi_th_sx: string
  parno: string
  model_turbo: string
  ma_dong_co: string
  oem_part_no: string
  dac_diem: string
  ung_dung: string
  hinh_anh: string
  ghi_chu: string
  gia_von: string | number | null
  gia_vip: string | number | null
  gia_uu_dai: string | number | null
  gia_dai_ly: string | number | null
  gia_gara: string | number | null
  gia_dl_10: string | number | null
  cg_duoi: string | number | null
  cg_dinh: string | number | null
  cg_so: string
  cl_duoi: string | number | null
  cl_dinh: string | number | null
  cl_so: string
  sheet_name: string
  created_at: string
  updated_at: string
  category_name: string
  hang_may_name: string
  hang_sx_name: string
  thuong_hieu_name: string
}

interface DbCheckRow {
  row_number: number
  ma_vt: string
  status: DbCheckStatus
  db_count: number
  products: Array<DbCheckProduct>
}

interface DbCheckResponse {
  summary: {
    total: number
    exists: number
    new: number
    missing_code: number
    duplicate_excel: number
    multiple_db: number
  }
  rows: Array<DbCheckRow>
}

type SyncMissingStatus =
  | 'UPDATED'
  | 'UNCHANGED'
  | 'NEW'
  | 'MISSING_CODE'
  | 'DUPLICATE_EXCEL'
  | 'MULTIPLE_DB'

interface SyncMissingRow {
  row_number: number
  ma_vt: string
  status: SyncMissingStatus
  db_count: number
  updated_fields: Array<string>
  invalid_fields: Array<string>
}

interface SyncMissingResponse {
  summary: {
    total: number
    updated: number
    unchanged: number
    skipped_new: number
    skipped_missing_code: number
    skipped_duplicate_excel: number
    skipped_multiple_db: number
    invalid: number
  }
  mapped_fields: Array<{ label: string; field: string }>
  rows: Array<SyncMissingRow>
}

const numberFmt = new Intl.NumberFormat('vi-VN')
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200]
const HEADER_SCAN_ROWS = 15
const COMPARE_STORAGE_KEY = 'excel-import-compare-payload'

function fm(n: number) {
  return numberFmt.format(n)
}

function uploadExcel<T>(url: string, file: File): Promise<T> {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient
    .post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    })
    .then(({ data }) => data)
}

function SummaryTile({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
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

function isHelperHeader(label: string) {
  const value = label.trim()
  return !value || value === '0' || value.startsWith('_')
}

function normalizeHeader(label: string) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

function getStatusMeta(status?: DbCheckStatus) {
  switch (status) {
    case 'EXISTS':
      return { label: 'Có DB', className: 'border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]' }
    case 'NEW':
      return { label: 'Mới', className: 'border-[#00bad1]/30 bg-[#00bad1]/10 text-[#00bad1]' }
    case 'DUPLICATE_EXCEL':
      return { label: 'Trùng Excel', className: 'border-[#ff9f43]/30 bg-[#ff9f43]/10 text-[#ff9f43]' }
    case 'MULTIPLE_DB':
      return { label: 'Nhiều DB', className: 'border-[#ff9f43]/30 bg-[#ff9f43]/10 text-[#ff9f43]' }
    case 'MISSING_CODE':
      return { label: 'Thiếu mã', className: 'border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]' }
    default:
      return { label: 'Chưa check', className: 'border-border/70 bg-muted/35 text-muted-foreground' }
  }
}

function getSyncStatusLabel(status?: SyncMissingStatus) {
  switch (status) {
    case 'UPDATED':
      return 'Đã bổ sung'
    case 'UNCHANGED':
      return 'Đã đủ dữ liệu'
    case 'NEW':
      return 'Mã mới'
    case 'DUPLICATE_EXCEL':
      return 'Trùng Excel'
    case 'MULTIPLE_DB':
      return 'Nhiều DB'
    case 'MISSING_CODE':
      return 'Thiếu mã'
    default:
      return 'Chưa đồng bộ'
  }
}

function dbValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function dbMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? `${fm(numeric)} đ` : String(value)
}

function dbDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN')
}

function DetailSection({
  title,
  items,
}: {
  title: string
  items: Array<{ label: string; value: string | number | null | undefined; wide?: boolean }>
}) {
  return (
    <div className="rounded-md border border-border/50 bg-background/70 p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className={cn('min-w-0', item.wide && 'sm:col-span-2')}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
              {item.label}
            </div>
            <div className="mt-0.5 whitespace-pre-wrap break-words text-xs text-foreground">
              {dbValue(item.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DbProductCard({ product }: { product: DbCheckProduct }) {
  return (
    <div className="rounded-md border border-border/60 bg-background/80 p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">#{product.id}</span>
        <Badge variant="outline" className="h-5 px-2 text-[11px]">
          {product.loai_display || product.loai}
        </Badge>
        <span className="text-sm font-semibold text-foreground">{product.ma_vt}</span>
      </div>

      <div className="space-y-3">
        <DetailSection
          title="Định danh"
          items={[
            { label: 'Mã VT', value: product.ma_vt },
            { label: 'Loại', value: product.loai_display || product.loai },
            { label: 'Tên hàng', value: product.ten_hang, wide: true },
            { label: 'Danh mục', value: product.category_name },
            { label: 'Hãng máy', value: product.hang_may_name },
            { label: 'Hãng SX', value: product.hang_sx_name },
            { label: 'Thương hiệu', value: product.thuong_hieu_name },
            { label: 'ĐVT', value: product.dvt },
            { label: 'Đời/TH SX', value: product.doi_th_sx },
            { label: 'PARNO', value: product.parno, wide: true },
            { label: 'Sheet gốc', value: product.sheet_name },
            { label: 'Cập nhật', value: dbDate(product.updated_at) },
          ]}
        />

        <DetailSection
          title="Mô tả / Turbo"
          items={[
            { label: 'Model Turbo', value: product.model_turbo },
            { label: 'Mã động cơ', value: product.ma_dong_co },
            { label: 'OEM Part No', value: product.oem_part_no, wide: true },
            { label: 'Đặc điểm', value: product.dac_diem, wide: true },
            { label: 'Ứng dụng', value: product.ung_dung, wide: true },
            { label: 'Ghi chú', value: product.ghi_chu, wide: true },
            { label: 'Hình ảnh', value: product.hinh_anh, wide: true },
          ]}
        />

        <DetailSection
          title="Giá"
          items={[
            { label: 'Giá vốn', value: dbMoney(product.gia_von) },
            { label: 'Giá bán / đại lý', value: dbMoney(product.gia_dai_ly) },
            { label: 'Giá ưu đãi', value: dbMoney(product.gia_uu_dai) },
            { label: 'Giá VIP', value: dbMoney(product.gia_vip) },
            { label: 'Giá gara', value: dbMoney(product.gia_gara) },
            { label: 'Giá ĐL +10%', value: dbMoney(product.gia_dl_10) },
          ]}
        />

        <DetailSection
          title="Kỹ thuật CG / CL"
          items={[
            { label: 'CG Ø dưới', value: product.cg_duoi },
            { label: 'CG Ø đỉnh', value: product.cg_dinh },
            { label: 'CG số', value: product.cg_so },
            { label: 'CL Ø dưới', value: product.cl_duoi },
            { label: 'CL Ø đỉnh', value: product.cl_dinh },
            { label: 'CL số', value: product.cl_so },
          ]}
        />
      </div>
    </div>
  )
}

function CheckResultPanel({
  selectedRow,
  selectedMaVt,
  dbRow,
  syncRow,
  excelCells,
  onOpenCompare,
}: {
  selectedRow: WorkbookRow
  selectedMaVt: string
  dbRow: DbCheckRow | null
  syncRow: SyncMissingRow | null
  excelCells: Array<{ label: string; value: string; valueIndex: number }>
  onOpenCompare: () => void
}) {
  const statusMeta = getStatusMeta(dbRow?.status)

  return (
    <div className="border-t border-border/60 bg-muted/10 px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-foreground">Kết quả kiểm tra dòng {selectedRow.row_number}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Mã VT: <span className="font-semibold text-foreground">{selectedMaVt || '-'}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn('border', statusMeta.className)}>{statusMeta.label}</Badge>
          {syncRow && <Badge variant="secondary">{getSyncStatusLabel(syncRow.status)}</Badge>}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            disabled={!dbRow}
            onClick={onOpenCompare}
            title={dbRow ? 'Mở trang đối chiếu chi tiết' : 'Check DB trước khi mở đối chiếu'}
          >
            <Columns3 className="h-4 w-4" />
            Mở đối chiếu
          </Button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-md border border-border/60 bg-card/80 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dữ liệu trong DB
          </div>
          {!dbRow ? (
            <div className="rounded-md border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
              Chưa check DB cho dòng này.
            </div>
          ) : dbRow.products.length === 0 ? (
            <div className="rounded-md border border-[#00bad1]/25 bg-[#00bad1]/10 px-3 py-4 text-sm text-[#00bad1]">
              Chưa có sản phẩm nào trong DB theo mã này.
            </div>
          ) : (
            <div className="space-y-2">
              {dbRow.products.map((product) => (
                <DbProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {syncRow && (
            <div className="mt-3 rounded-md border border-border/60 bg-background/70 p-3 text-xs">
              <div className="font-semibold text-foreground">Kết quả đồng bộ</div>
              <div className="mt-1 text-muted-foreground">
                {syncRow.updated_fields.length > 0
                  ? `Đã bổ sung: ${syncRow.updated_fields.join(', ')}`
                  : 'Không có field trống cần bổ sung.'}
              </div>
              {syncRow.invalid_fields.length > 0 && (
                <div className="mt-1 text-[#ff4c51]">
                  Lỗi dữ liệu: {syncRow.invalid_fields.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-md border border-border/60 bg-card/80 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dữ liệu Excel đang chọn
          </div>
          <div className="max-h-[280px] overflow-auto rounded-md border border-border/50">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {excelCells.map((cell, index) => (
                  <tr key={`${cell.label}-${index}`} className="border-b border-border/40 last:border-0">
                    <td className="w-[180px] border-r border-border/40 bg-muted/20 px-3 py-2 font-semibold text-muted-foreground">
                      {cell.label}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      <div className="whitespace-pre-wrap break-words">{cell.value || '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function getHeaderRow(sheet: WorkbookSheet | null) {
  if (!sheet || sheet.rows.length === 0) return null

  const candidates = sheet.rows.slice(0, HEADER_SCAN_ROWS)
  let best = candidates[0]
  let bestScore = -1

  for (const row of candidates) {
    const score = row.values.reduce((count, value) => count + (value.trim() ? 1 : 0), 0)
    if (score > bestScore) {
      best = row
      bestScore = score
    }
  }

  return bestScore > 1 ? best : sheet.rows[0]
}

function SheetPagination({
  currentPage,
  totalPages,
  totalRows,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number
  totalPages: number
  totalRows: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const start = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalRows)

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold tabular-nums text-foreground">{fm(start)}-{fm(end)}</span>
          {' / '}
          <span className="font-semibold tabular-nums text-foreground">{fm(totalRows)}</span>
          {' dòng'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">/ trang</span>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-8 w-[78px] text-xs">
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

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="Trang đầu"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[92px] px-2 text-center text-sm font-semibold tabular-nums text-foreground">
          {fm(currentPage)} / {fm(totalPages)}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Trang cuối"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function ImportExcelPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { isAuthenticated } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<WorkbookPreviewResponse | null>(null)
  const [selectedSheetName, setSelectedSheetName] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [dbCheck, setDbCheck] = useState<DbCheckResponse | null>(null)
  const [syncResult, setSyncResult] = useState<SyncMissingResponse | null>(null)
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null)

  const previewMutation = useMutation({
    mutationFn: (targetFile: File) => uploadExcel<WorkbookPreviewResponse>('/imports/excel/preview/', targetFile),
    onSuccess: (data) => {
      setPreview(data)
      setSelectedSheetName(data.sheets[0]?.sheet_name ?? '')
      setCurrentPage(1)
      setDbCheck(null)
      setSyncResult(null)
      setSelectedRowNumber(null)
      toast.success('Đã đọc file Excel')
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<{ error?: string }>
      const message = axiosError?.response?.data?.error ?? 'Không thể đọc file Excel'
      toast.error(message)
    },
  })

  const dbCheckMutation = useMutation({
    mutationFn: (rows: Array<{ row_number: number; ma_vt: string }>) =>
      apiClient.post<DbCheckResponse>('/imports/excel/check-db/', { rows }).then(({ data }) => data),
    onSuccess: (data) => {
      setDbCheck(data)
      toast.success('Đã check mã trong DB')
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<{ error?: string }>
      const message = axiosError?.response?.data?.error ?? 'Không thể check DB'
      toast.error(message)
    },
  })

  const syncMissingMutation = useMutation({
    mutationFn: (payload: {
      sheet_name: string
      columns: Array<{ label: string; valueIndex: number }>
      rows: Array<{ row_number: number; values: Array<string> }>
    }) =>
      apiClient
        .post<SyncMissingResponse>('/imports/excel/sync-missing/', payload, { timeout: 120_000 })
        .then(({ data }) => data),
    onSuccess: (data) => {
      setSyncResult(data)
      toast.success(`Đã bổ sung ${fm(data.summary.updated)} dòng còn thiếu`)
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<{ error?: string }>
      const message = axiosError?.response?.data?.error ?? 'Không thể đồng bộ field thiếu'
      toast.error(message)
    },
  })

  const selectedSheet = useMemo(() => {
    if (!preview) return null
    return preview.sheets.find((sheet) => sheet.sheet_name === selectedSheetName) ?? preview.sheets[0] ?? null
  }, [preview, selectedSheetName])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setPreview(null)
    setSelectedSheetName('')
    setCurrentPage(1)
    setDbCheck(null)
    setSyncResult(null)
    setSelectedRowNumber(null)
  }

  const handlePreview = () => {
    if (!file) return
    previewMutation.mutate(file)
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setSelectedSheetName('')
    setCurrentPage(1)
    setDbCheck(null)
    setSyncResult(null)
    setSelectedRowNumber(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const headerRow = useMemo(() => getHeaderRow(selectedSheet), [selectedSheet])
  const displayColumns = useMemo(() => {
    if (!selectedSheet) return []
    return selectedSheet.columns
      .map((column, index) => ({
        ...column,
        label: headerRow?.values[index]?.trim() || column.label,
        valueIndex: index,
      }))
      .filter((column) => !isHelperHeader(column.label))
  }, [selectedSheet, headerRow])
  const maVtColumn = useMemo(() => {
    return displayColumns.find((column) => {
      const normalized = normalizeHeader(column.label)
      return normalized === 'MA_VT' || normalized === 'MA_HH' || normalized.includes('MA_VT')
    }) ?? null
  }, [displayColumns])
  const dataRows = useMemo(() => {
    if (!selectedSheet) return []
    if (!headerRow) return selectedSheet.rows
    return selectedSheet.rows.filter((row) => row.row_number > headerRow.row_number)
  }, [selectedSheet, headerRow])
  const selectedRow = useMemo(() => {
    if (selectedRowNumber === null) return null
    return dataRows.find((row) => row.row_number === selectedRowNumber) ?? null
  }, [dataRows, selectedRowNumber])
  const totalSheetRows = dataRows.length
  const totalPages = Math.max(1, Math.ceil(totalSheetRows / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRows = dataRows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const dbRowsByNumber = useMemo(() => {
    const map = new Map<number, DbCheckRow>()
    for (const row of dbCheck?.rows ?? []) {
      map.set(row.row_number, row)
    }
    return map
  }, [dbCheck])
  const syncRowsByNumber = useMemo(() => {
    const map = new Map<number, SyncMissingRow>()
    for (const row of syncResult?.rows ?? []) {
      map.set(row.row_number, row)
    }
    return map
  }, [syncResult])
  const selectedDbRow = useMemo(() => {
    if (selectedRowNumber === null) return null
    return dbRowsByNumber.get(selectedRowNumber) ?? null
  }, [dbRowsByNumber, selectedRowNumber])
  const selectedSyncRow = useMemo(() => {
    if (selectedRowNumber === null) return null
    return syncRowsByNumber.get(selectedRowNumber) ?? null
  }, [syncRowsByNumber, selectedRowNumber])
  const selectedMaVt = selectedRow && maVtColumn
    ? selectedRow.values[maVtColumn.valueIndex] ?? ''
    : ''
  const selectedExcelCells = useMemo(() => {
    if (!selectedRow) return []
    return displayColumns.map((column) => ({
      label: column.label,
      value: selectedRow.values[column.valueIndex] ?? '',
      valueIndex: column.valueIndex,
    }))
  }, [displayColumns, selectedRow])

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize)
    setCurrentPage(1)
    setSelectedRowNumber(null)
    setDbCheck(null)
    setSyncResult(null)
  }

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(nextPage)
    setSelectedRowNumber(null)
    setDbCheck(null)
    setSyncResult(null)
  }

  const handleSelectRow = (rowNumber: number, checked: boolean) => {
    setSelectedRowNumber(checked ? rowNumber : null)
    setDbCheck(null)
    setSyncResult(null)
  }

  const handleCheckDb = () => {
    if (!maVtColumn) {
      toast.error('Không tìm thấy cột MÃ VT trong sheet đang xem')
      return
    }
    if (!selectedRow) {
      toast.error('Bạn cần tick 1 dòng trước khi Check DB')
      return
    }

    const rows = [{
      row_number: selectedRow.row_number,
      ma_vt: selectedRow.values[maVtColumn.valueIndex] ?? '',
    }]
    setSyncResult(null)
    dbCheckMutation.mutate(rows)
  }

  const handleSyncMissing = () => {
    if (!dbCheck) {
      toast.error('Bạn cần Check DB trước khi đồng bộ')
      return
    }
    if (!maVtColumn || !selectedSheet) {
      toast.error('Không tìm thấy cột MÃ VT trong sheet đang xem')
      return
    }
    if (!selectedRow) {
      toast.error('Bạn cần tick 1 dòng trước khi đồng bộ')
      return
    }

    syncMissingMutation.mutate({
      sheet_name: selectedSheet.sheet_name,
      columns: displayColumns.map((column) => ({
        label: column.label,
        valueIndex: column.valueIndex,
      })),
      rows: [{
        row_number: selectedRow.row_number,
        values: selectedRow.values,
      }],
    })
  }

  const handleOpenCompare = () => {
    if (!preview || !selectedSheet || !selectedRow) {
      toast.error('Bạn cần chọn 1 dòng trước khi mở đối chiếu')
      return
    }
    if (!selectedDbRow) {
      toast.error('Bạn cần Check DB trước khi mở trang đối chiếu')
      return
    }

    const payload = {
      fileName: preview.file_name,
      sheetName: selectedSheet.sheet_name,
      rowNumber: selectedRow.row_number,
      maVt: selectedMaVt,
      checkedAt: new Date().toISOString(),
      dbRow: selectedDbRow,
      syncRow: selectedSyncRow,
      excelCells: selectedExcelCells,
    }

    window.sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(payload))
    navigate('/import-excel/compare', { state: payload })
  }

  const headerStats = preview ? (
    <div className="text-right text-sm">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Đối chiếu Excel</div>
      <div className="max-w-[260px] truncate font-bold tabular-nums text-foreground">{preview.file_name}</div>
    </div>
  ) : null

  return (
    <div className="min-h-screen bg-background">
      <AppHeader stats={headerStats} />

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 md:px-6">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="flex flex-wrap items-center gap-3 p-3.5">
            <FileSpreadsheet className="h-5 w-5 text-[#28c76f]" />
            <div className="min-w-[190px]">
              <p className="text-sm font-semibold text-foreground">Đối chiếu Excel</p>
              <p className="truncate text-xs text-muted-foreground">
                {file ? file.name : 'Chưa chọn file'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
              Về trang chính
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="min-w-[260px] max-w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
            />
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={!file || !isAuthenticated || previewMutation.isPending}
              onClick={handlePreview}
            >
              {previewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Xem sheet
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!file && !preview}
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              Xóa
            </Button>
          </CardContent>
        </Card>

        {!isAuthenticated && (
          <div className="rounded-lg border border-[#ff9f43]/30 bg-[#ff9f43]/10 px-4 py-3 text-sm text-[#ff9f43]">
            Cần đăng nhập để xem file Excel.
          </div>
        )}

        {preview && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <SummaryTile label="Số sheet" value={preview.summary.sheet_count} />
              <SummaryTile label="Tổng dòng có dữ liệu" value={preview.summary.total_rows} />
              <SummaryTile label="Sheet đang xem" value={selectedSheet?.sheet_name ?? '-'} />
              <SummaryTile label="Số cột hiển thị" value={displayColumns.length} />
            </div>

            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  Sheet trong file
                  <Badge variant="secondary" className="h-5 px-2 text-[11px]">
                    {fm(preview.sheets.length)}
                  </Badge>
                </CardTitle>
                {selectedSheet && (
                  <div className="hidden text-right text-xs text-muted-foreground md:block">
                    <span className="font-semibold text-foreground">{selectedSheet.sheet_name}</span>
                    {' · '}
                    {fm(selectedSheet.row_count)} dòng
                    {' · '}
                    {fm(selectedSheet.column_count)} cột
                  </div>
                )}
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {preview.sheets.map((sheet) => (
                    <button
                      key={sheet.sheet_name}
                      type="button"
                      onClick={() => {
                        setSelectedSheetName(sheet.sheet_name)
                        setCurrentPage(1)
                        setDbCheck(null)
                        setSyncResult(null)
                        setSelectedRowNumber(null)
                      }}
                      className={cn(
                        'min-w-[190px] rounded-md border px-3 py-2 text-left text-xs transition-colors',
                        selectedSheet?.sheet_name === sheet.sheet_name
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/45',
                      )}
                      title={sheet.sheet_name}
                    >
                      <div className="truncate font-semibold">{sheet.sheet_name}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                          {fm(sheet.row_count)} dòng
                        </Badge>
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                          {fm(sheet.column_count)} cột
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3">
                <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">Bảng đối chiếu</span>
                  {selectedSheet && (
                    <Badge variant="outline" className="h-5 max-w-[320px] truncate px-2 text-[11px]">
                      {selectedSheet.sheet_name}
                    </Badge>
                  )}
                </CardTitle>
                {selectedSheet && (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className="text-xs text-muted-foreground">
                      Dòng {headerRow?.row_number ?? 1} đang được dùng làm tiêu đề cột.
                      {selectedRowNumber !== null && (
                        <span className="ml-2 font-semibold text-foreground">
                          Đã chọn dòng {selectedRowNumber}
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5"
                      disabled={!maVtColumn || !selectedRow || dbCheckMutation.isPending}
                      onClick={handleCheckDb}
                      title={
                        maVtColumn
                          ? selectedRow
                            ? `Check dòng ${selectedRow.row_number} theo cột ${maVtColumn.label}`
                            : 'Tick 1 dòng trước khi Check DB'
                          : 'Không tìm thấy cột MÃ VT'
                      }
                    >
                      {dbCheckMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Database className="h-4 w-4" />
                      )}
                      Check DB
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 gap-1.5"
                      disabled={!dbCheck || !maVtColumn || !selectedRow || syncMissingMutation.isPending}
                      onClick={handleSyncMissing}
                      title={dbCheck ? 'Chỉ bổ sung field đang trống trong DB cho dòng đã chọn' : 'Check DB trước khi đồng bộ'}
                    >
                      {syncMissingMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Đồng bộ thiếu
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {dbCheck && (
                  <div className="flex flex-wrap gap-2 border-t border-border/60 px-4 py-3 text-xs">
                    <Badge className="border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]">
                      Có DB: {fm(dbCheck.summary.exists)}
                    </Badge>
                    <Badge className="border-[#00bad1]/30 bg-[#00bad1]/10 text-[#00bad1]">
                      Mới: {fm(dbCheck.summary.new)}
                    </Badge>
                    <Badge className="border-[#ff9f43]/30 bg-[#ff9f43]/10 text-[#ff9f43]">
                      Trùng Excel: {fm(dbCheck.summary.duplicate_excel)}
                    </Badge>
                    <Badge className="border-[#ff9f43]/30 bg-[#ff9f43]/10 text-[#ff9f43]">
                      Nhiều DB: {fm(dbCheck.summary.multiple_db)}
                    </Badge>
                    <Badge className="border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]">
                      Thiếu mã: {fm(dbCheck.summary.missing_code)}
                    </Badge>
                  </div>
                )}
                {syncResult && (
                  <div className="flex flex-wrap gap-2 border-t border-border/60 bg-muted/15 px-4 py-3 text-xs">
                    <Badge className="border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]">
                      Đã bổ sung: {fm(syncResult.summary.updated)}
                    </Badge>
                    <Badge variant="secondary">
                      Đã đủ: {fm(syncResult.summary.unchanged)}
                    </Badge>
                    <Badge variant="secondary">
                      Mới chưa có DB: {fm(syncResult.summary.skipped_new)}
                    </Badge>
                    <Badge variant="secondary">
                      Trùng Excel: {fm(syncResult.summary.skipped_duplicate_excel)}
                    </Badge>
                    <Badge variant="secondary">
                      Nhiều DB: {fm(syncResult.summary.skipped_multiple_db)}
                    </Badge>
                    <Badge className="border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]">
                      Lỗi dữ liệu: {fm(syncResult.summary.invalid)}
                    </Badge>
                  </div>
                )}
                {selectedRow && (
                  <CheckResultPanel
                    selectedRow={selectedRow}
                    selectedMaVt={selectedMaVt}
                    dbRow={selectedDbRow}
                    syncRow={selectedSyncRow}
                    excelCells={selectedExcelCells}
                    onOpenCompare={handleOpenCompare}
                  />
                )}
                {!selectedSheet || selectedSheet.rows.length === 0 ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    Sheet này không có dữ liệu.
                  </div>
                ) : (
                  <>
                    <div className="max-h-[650px] overflow-auto">
                      <table className="w-full border-collapse text-xs">
                        <thead className="sticky top-0 z-20 bg-card">
                          <tr>
                            <th className="sticky left-0 z-30 w-[48px] min-w-[48px] border-b border-r border-border/70 bg-card px-3 py-2 text-center font-semibold text-muted-foreground">
                              Chọn
                            </th>
                            <th className="sticky left-[48px] z-30 min-w-[72px] border-b border-r border-border/70 bg-card px-3 py-2 text-left font-semibold text-muted-foreground">
                              Dòng
                            </th>
                            <th className="min-w-[120px] border-b border-r border-border/70 bg-card px-3 py-2 text-left font-semibold text-muted-foreground">
                              DB
                            </th>
                            {displayColumns.map((column) => (
                              <th
                                key={column.key}
                                className="min-w-[150px] border-b border-r border-border/70 bg-card px-3 py-2 text-left font-semibold text-foreground"
                              >
                                <div className="whitespace-pre-wrap break-words">{column.label}</div>
                                <div className="mt-0.5 text-[10px] font-normal text-muted-foreground">
                                  {column.key}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRows.map((row) => (
                            (() => {
                              const dbRow = dbRowsByNumber.get(row.row_number)
                              const syncRow = syncRowsByNumber.get(row.row_number)
                              const meta = getStatusMeta(dbRow?.status)
                              const firstProduct = dbRow?.products[0]

                              return (
                                <tr
                                  key={row.row_number}
                                  className={cn(
                                    'border-b border-border/40 hover:bg-muted/35',
                                    selectedRowNumber === row.row_number && 'bg-primary/5',
                                  )}
                                >
                                  <td className="sticky left-0 z-10 border-r border-border/70 bg-card px-3 py-2 text-center">
                                    <Checkbox
                                      checked={selectedRowNumber === row.row_number}
                                      onCheckedChange={(checked) => handleSelectRow(row.row_number, checked === true)}
                                      aria-label={`Chọn dòng ${row.row_number}`}
                                      className="h-4 w-4"
                                    />
                                  </td>
                                  <td className="sticky left-[48px] z-10 border-r border-border/70 bg-card px-3 py-2 font-mono text-[11px] text-muted-foreground">
                                    {row.row_number}
                                  </td>
                                  <td className="border-r border-border/40 px-3 py-2 align-top">
                                    <Badge className={cn('border text-[10px]', meta.className)}>
                                      {meta.label}
                                      {dbRow && dbRow.db_count > 1 ? ` (${dbRow.db_count})` : ''}
                                    </Badge>
                                    {firstProduct && (
                                      <div className="mt-1 max-w-[180px] truncate text-[10px] text-muted-foreground" title={firstProduct.ten_hang}>
                                        #{firstProduct.id} {firstProduct.loai}
                                      </div>
                                    )}
                                    {syncRow?.status === 'UPDATED' && (
                                      <div
                                        className="mt-1 max-w-[180px] truncate text-[10px] font-medium text-[#28c76f]"
                                        title={syncRow.updated_fields.join(', ')}
                                      >
                                        Bổ sung: {syncRow.updated_fields.length} field
                                      </div>
                                    )}
                                    {syncRow && syncRow.invalid_fields.length > 0 && (
                                      <div
                                        className="mt-1 max-w-[180px] truncate text-[10px] font-medium text-[#ff4c51]"
                                        title={syncRow.invalid_fields.join(', ')}
                                      >
                                        Lỗi dữ liệu: {syncRow.invalid_fields.length}
                                      </div>
                                    )}
                                  </td>
                                  {displayColumns.map((column) => (
                                    <td
                                      key={`${row.row_number}-${column.key}`}
                                      className="max-w-[320px] border-r border-border/40 px-3 py-2 align-top text-foreground"
                                    >
                                      <div className="whitespace-pre-wrap break-words">
                                        {row.values[column.valueIndex] || ''}
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              )
                            })()
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <SheetPagination
                      currentPage={safePage}
                      totalPages={totalPages}
                      totalRows={totalSheetRows}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
