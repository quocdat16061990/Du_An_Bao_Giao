import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Columns3, Database, FileSpreadsheet } from 'lucide-react'

import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type DbCheckStatus = 'EXISTS' | 'NEW' | 'MISSING_CODE' | 'DUPLICATE_EXCEL' | 'MULTIPLE_DB'
type SyncMissingStatus = 'UPDATED' | 'UNCHANGED' | 'NEW' | 'MISSING_CODE' | 'DUPLICATE_EXCEL' | 'MULTIPLE_DB'

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

interface SyncMissingRow {
  row_number: number
  ma_vt: string
  status: SyncMissingStatus
  db_count: number
  updated_fields: Array<string>
  invalid_fields: Array<string>
}

interface ComparePayload {
  fileName: string
  sheetName: string
  rowNumber: number
  maVt: string
  checkedAt: string
  dbRow: DbCheckRow
  syncRow: SyncMissingRow | null
  excelCells: Array<{ label: string; value: string; valueIndex: number }>
}

type ProductField = keyof DbCheckProduct

interface FieldDef {
  group: string
  field: ProductField
  label: string
}

interface CompareRow {
  group: string
  excelColumn: string
  excelValue: string
  dbField: string
  dbLabel: string
  dbValue: string
  status: CompareStatus
}

type CompareStatus =
  | 'MATCH'
  | 'DIFF'
  | 'DB_EMPTY'
  | 'EXCEL_EMPTY'
  | 'DB_ONLY'
  | 'NO_DB_PRODUCT'
  | 'UNMAPPED_EXCEL'
  | 'BOTH_EMPTY'

const COMPARE_STORAGE_KEY = 'excel-import-compare-payload'
const numberFmt = new Intl.NumberFormat('vi-VN')

const PRODUCT_FIELD_GROUPS: Array<{ group: string; fields: Array<{ field: ProductField; label: string }> }> = [
  {
    group: 'Định danh',
    fields: [
      { field: 'ma_vt', label: 'Mã VT' },
      { field: 'loai_display', label: 'Loại' },
      { field: 'ten_hang', label: 'Tên hàng' },
      { field: 'category_name', label: 'Danh mục' },
      { field: 'hang_may_name', label: 'Hãng máy' },
      { field: 'hang_sx_name', label: 'Hãng SX' },
      { field: 'thuong_hieu_name', label: 'Thương hiệu' },
      { field: 'dvt', label: 'ĐVT' },
      { field: 'doi_th_sx', label: 'Đời/TH SX' },
      { field: 'parno', label: 'PARNO' },
      { field: 'sheet_name', label: 'Sheet gốc' },
    ],
  },
  {
    group: 'Mô tả / Turbo',
    fields: [
      { field: 'model_turbo', label: 'Model Turbo' },
      { field: 'ma_dong_co', label: 'Mã động cơ' },
      { field: 'oem_part_no', label: 'OEM Part No' },
      { field: 'dac_diem', label: 'Đặc điểm' },
      { field: 'ung_dung', label: 'Ứng dụng' },
      { field: 'ghi_chu', label: 'Ghi chú' },
      { field: 'hinh_anh', label: 'Hình ảnh' },
    ],
  },
  {
    group: 'Giá',
    fields: [
      { field: 'gia_von', label: 'Giá vốn' },
      { field: 'gia_dai_ly', label: 'Giá bán / đại lý' },
      { field: 'gia_uu_dai', label: 'Giá ưu đãi' },
      { field: 'gia_vip', label: 'Giá VIP' },
      { field: 'gia_gara', label: 'Giá gara' },
      { field: 'gia_dl_10', label: 'Giá ĐL +10%' },
    ],
  },
  {
    group: 'Kỹ thuật CG / CL',
    fields: [
      { field: 'cg_duoi', label: 'CG Ø dưới' },
      { field: 'cg_dinh', label: 'CG Ø đỉnh' },
      { field: 'cg_so', label: 'CG số' },
      { field: 'cl_duoi', label: 'CL Ø dưới' },
      { field: 'cl_dinh', label: 'CL Ø đỉnh' },
      { field: 'cl_so', label: 'CL số' },
    ],
  },
]

const PRODUCT_FIELDS: Array<FieldDef> = PRODUCT_FIELD_GROUPS.flatMap((group) =>
  group.fields.map((field) => ({ ...field, group: group.group })),
)

const MONEY_FIELDS = new Set(['gia_von', 'gia_dai_ly', 'gia_uu_dai', 'gia_vip', 'gia_gara', 'gia_dl_10'])

const HEADER_FIELD_MAP: Record<string, ProductField> = {
  MA_VT: 'ma_vt',
  MA_HH: 'ma_vt',
  TEN_HANG: 'ten_hang',
  TEN_DONG_CO: 'ten_hang',
  HANG_MAY: 'hang_may_name',
  HANG_SX: 'hang_sx_name',
  THUONG_HIEU: 'thuong_hieu_name',
  MODEL: 'model_turbo',
  MODEL_TURBO: 'model_turbo',
  MA_DONG_CO: 'ma_dong_co',
  OEM: 'oem_part_no',
  OEM_PART_NO: 'oem_part_no',
  PART_NO: 'oem_part_no',
  DAC_DIEM: 'dac_diem',
  UNG_DUNG: 'ung_dung',
  GHI_CHU: 'ghi_chu',
  DVT: 'dvt',
  DOI_TH_SX: 'doi_th_sx',
  PARNO: 'parno',
  GIA_BAN: 'gia_dai_ly',
  GIA_DAI_LY: 'gia_dai_ly',
  GIA_DL: 'gia_dai_ly',
  GIA_UU_DAI: 'gia_uu_dai',
  GIA_VIP: 'gia_vip',
  GIA_GARA: 'gia_gara',
  GIA_VON: 'gia_von',
  GIA_DL_10: 'gia_dl_10',
  CG_DUOI: 'cg_duoi',
  CG_DINH: 'cg_dinh',
  CG_SO: 'cg_so',
  CL_DUOI: 'cl_duoi',
  CL_DINH: 'cl_dinh',
  CL_SO: 'cl_so',
}

function normalizeHeader(label: string) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/Ø/g, ' ')
    .replace(/ø/g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

function fieldForExcelHeader(label: string): ProductField | null {
  const normalized = normalizeHeader(label)
  if (HEADER_FIELD_MAP[normalized]) return HEADER_FIELD_MAP[normalized]
  if (normalized.includes('MA_VT')) return 'ma_vt'
  if (normalized.includes('MODEL_TURBO')) return 'model_turbo'
  if (normalized.includes('OEM')) return 'oem_part_no'
  return null
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function normalizeCompareValue(value: unknown) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

function formatMoney(value: unknown) {
  if (!hasValue(value)) return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? `${numberFmt.format(numeric)} đ` : String(value)
}

function formatDate(value: unknown) {
  if (!hasValue(value)) return '-'
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('vi-VN')
}

function formatDbField(field: ProductField | string, value: unknown) {
  if (MONEY_FIELDS.has(String(field))) return formatMoney(value)
  if (field === 'created_at' || field === 'updated_at') return formatDate(value)
  return hasValue(value) ? String(value) : '-'
}

function compareStatus(product: DbCheckProduct | null, dbValue: unknown, excelValue: string, hasExcelColumn: boolean): CompareStatus {
  const dbHasValue = hasValue(dbValue)
  const excelHasValue = hasValue(excelValue)

  if (!product) return 'NO_DB_PRODUCT'
  if (!hasExcelColumn) return dbHasValue ? 'DB_ONLY' : 'BOTH_EMPTY'
  if (!dbHasValue && !excelHasValue) return 'BOTH_EMPTY'
  if (!dbHasValue) return 'DB_EMPTY'
  if (!excelHasValue) return 'EXCEL_EMPTY'
  return normalizeCompareValue(dbValue) === normalizeCompareValue(excelValue) ? 'MATCH' : 'DIFF'
}

function statusMeta(status: CompareStatus) {
  switch (status) {
    case 'MATCH':
      return { label: 'Có cả hai - giống', className: 'border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]' }
    case 'DIFF':
      return { label: 'Có cả hai - khác', className: 'border-[#ff9f43]/30 bg-[#ff9f43]/10 text-[#ff9f43]' }
    case 'DB_EMPTY':
      return { label: 'DB trống', className: 'border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]' }
    case 'EXCEL_EMPTY':
      return { label: 'Excel trống', className: 'border-[#ff9f43]/30 bg-[#ff9f43]/10 text-[#ff9f43]' }
    case 'DB_ONLY':
      return { label: 'Chỉ có DB', className: 'border-[#00bad1]/30 bg-[#00bad1]/10 text-[#00bad1]' }
    case 'UNMAPPED_EXCEL':
      return { label: 'Excel chưa map DB', className: 'border-border/70 bg-muted/35 text-muted-foreground' }
    case 'NO_DB_PRODUCT':
      return { label: 'Chưa có sản phẩm DB', className: 'border-[#00bad1]/30 bg-[#00bad1]/10 text-[#00bad1]' }
    default:
      return { label: 'Đều trống', className: 'border-border/70 bg-muted/35 text-muted-foreground' }
  }
}

function dbCheckStatusLabel(status: DbCheckStatus) {
  switch (status) {
    case 'EXISTS':
      return 'Có DB'
    case 'NEW':
      return 'Mới'
    case 'MISSING_CODE':
      return 'Thiếu mã'
    case 'DUPLICATE_EXCEL':
      return 'Trùng Excel'
    case 'MULTIPLE_DB':
      return 'Nhiều DB'
    default:
      return status
  }
}

function isComparePayload(value: unknown): value is ComparePayload {
  return Boolean(value && typeof value === 'object' && 'dbRow' in value && 'excelCells' in value)
}

function readStoredPayload(): ComparePayload | null {
  try {
    const raw = window.sessionStorage.getItem(COMPARE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isComparePayload(parsed) ? parsed : null
  } catch {
    return null
  }
}

function buildCompareRows(payload: ComparePayload, product: DbCheckProduct | null): Array<CompareRow> {
  const excelByField = new Map<ProductField, { label: string; value: string }>()
  const mappedExcelIndexes = new Set<number>()

  payload.excelCells.forEach((cell, index) => {
    const field = fieldForExcelHeader(cell.label)
    if (!field) return
    if (!excelByField.has(field)) {
      excelByField.set(field, { label: cell.label, value: cell.value })
      mappedExcelIndexes.add(index)
    }
  })

  const rows: Array<CompareRow> = PRODUCT_FIELDS.map((field) => {
    const excelCell = excelByField.get(field.field)
    const rawDbValue = product ? product[field.field] : null
    return {
      group: field.group,
      excelColumn: excelCell?.label ?? '-',
      excelValue: excelCell?.value ?? '',
      dbField: field.field,
      dbLabel: field.label,
      dbValue: formatDbField(field.field, rawDbValue),
      status: compareStatus(product, rawDbValue, excelCell?.value ?? '', Boolean(excelCell)),
    }
  })

  payload.excelCells.forEach((cell, index) => {
    if (mappedExcelIndexes.has(index)) return
    rows.push({
      group: 'Excel chưa map',
      excelColumn: cell.label,
      excelValue: cell.value,
      dbField: '-',
      dbLabel: 'Chưa có field DB tương ứng',
      dbValue: '-',
      status: 'UNMAPPED_EXCEL',
    })
  })

  return rows
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardContent className="p-3.5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-xl font-extrabold leading-tight tabular-nums text-foreground">
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ImportExcelComparePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const payload = useMemo(() => {
    if (isComparePayload(location.state)) return location.state
    return readStoredPayload()
  }, [location.state])
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    payload?.dbRow.products[0]?.id ?? null,
  )

  const selectedProduct = useMemo(() => {
    if (!payload) return null
    return payload.dbRow.products.find((product) => product.id === selectedProductId)
      ?? payload.dbRow.products[0]
      ?? null
  }, [payload, selectedProductId])

  const rows = useMemo(() => (payload ? buildCompareRows(payload, selectedProduct) : []), [payload, selectedProduct])
  const counts = useMemo(() => {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1
      return acc
    }, {})
  }, [rows])

  const headerStats = payload ? (
    <div className="text-right text-sm">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Đối chiếu dòng</div>
      <div className="max-w-[260px] truncate font-bold tabular-nums text-foreground">
        {payload.sheetName} / dòng {payload.rowNumber}
      </div>
    </div>
  ) : null

  if (!payload) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-[900px] px-4 py-8">
          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="py-12 text-center">
              <Columns3 className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
              <div className="text-lg font-bold text-foreground">Chưa có dữ liệu đối chiếu</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Quay lại trang Import Excel, tick 1 dòng, bấm Check DB rồi mở trang đối chiếu.
              </div>
              <Button className="mt-5 gap-1.5" onClick={() => navigate('/import-excel')}>
                <ArrowLeft className="h-4 w-4" />
                Về Import Excel
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader stats={headerStats} />

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 md:px-6">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <Columns3 className="h-5 w-5 shrink-0 text-[#00bad1]" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Đối chiếu Excel - DB</p>
                <p className="truncate text-xs text-muted-foreground">{payload.fileName}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/import-excel')}>
              <ArrowLeft className="h-4 w-4" />
              Về Import Excel
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SummaryTile label="Sheet" value={payload.sheetName} />
          <SummaryTile label="Dòng Excel" value={payload.rowNumber} />
          <SummaryTile label="Mã VT" value={payload.maVt || '-'} />
          <SummaryTile label="Trạng thái DB" value={dbCheckStatusLabel(payload.dbRow.status)} />
          <SummaryTile label="Sản phẩm DB" value={payload.dbRow.products.length} />
        </div>

        {payload.dbRow.products.length > 1 && (
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader className="px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4 text-muted-foreground" />
                Chọn sản phẩm DB để so sánh
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 px-4 pb-4 pt-0">
              {payload.dbRow.products.map((product) => (
                <Button
                  key={product.id}
                  variant={selectedProduct?.id === product.id ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSelectedProductId(product.id)}
                >
                  #{product.id}
                  <span className="max-w-[220px] truncate">{product.ten_hang || product.ma_vt}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3">
            <CardTitle className="flex min-w-0 items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">So sánh từng cột / field</span>
            </CardTitle>
            <div className="flex flex-wrap justify-end gap-2 text-xs">
              <Badge className="border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]">
                Giống: {counts.MATCH ?? 0}
              </Badge>
              <Badge className="border-[#ff9f43]/30 bg-[#ff9f43]/10 text-[#ff9f43]">
                Khác: {counts.DIFF ?? 0}
              </Badge>
              <Badge className="border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]">
                DB trống: {counts.DB_EMPTY ?? 0}
              </Badge>
              <Badge variant="secondary">
                Excel chưa map: {counts.UNMAPPED_EXCEL ?? 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedProduct && payload.dbRow.products.length === 0 && (
              <div className="border-t border-border/60 bg-[#00bad1]/10 px-4 py-3 text-sm text-[#00bad1]">
                Mã này chưa có sản phẩm trong DB. Bảng dưới vẫn hiển thị cột Excel và field DB dự kiến để đối chiếu.
              </div>
            )}
            <div className="max-h-[720px] overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-20 bg-card">
                  <tr>
                    <th className="min-w-[130px] border-b border-r border-border/70 px-3 py-2 text-left font-semibold text-muted-foreground">
                      Nhóm
                    </th>
                    <th className="min-w-[170px] border-b border-r border-border/70 px-3 py-2 text-left font-semibold text-muted-foreground">
                      Cột Excel
                    </th>
                    <th className="min-w-[260px] border-b border-r border-border/70 px-3 py-2 text-left font-semibold text-foreground">
                      Giá trị Excel
                    </th>
                    <th className="min-w-[150px] border-b border-r border-border/70 px-3 py-2 text-left font-semibold text-muted-foreground">
                      Field DB
                    </th>
                    <th className="min-w-[260px] border-b border-r border-border/70 px-3 py-2 text-left font-semibold text-foreground">
                      Giá trị DB
                    </th>
                    <th className="min-w-[150px] border-b border-border/70 px-3 py-2 text-left font-semibold text-muted-foreground">
                      Tình trạng
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const meta = statusMeta(row.status)
                    return (
                      <tr
                        key={`${row.group}-${row.dbField}-${row.excelColumn}-${index}`}
                        className={cn(
                          'border-b border-border/40 hover:bg-muted/30',
                          row.status === 'DB_EMPTY' && 'bg-[#ff4c51]/5',
                          row.status === 'DIFF' && 'bg-[#ff9f43]/5',
                        )}
                      >
                        <td className="border-r border-border/40 px-3 py-2 align-top font-semibold text-muted-foreground">
                          {row.group}
                        </td>
                        <td className="border-r border-border/40 px-3 py-2 align-top text-foreground">
                          {row.excelColumn}
                        </td>
                        <td className="border-r border-border/40 px-3 py-2 align-top text-foreground">
                          <div className="whitespace-pre-wrap break-words">{row.excelValue || '-'}</div>
                        </td>
                        <td className="border-r border-border/40 px-3 py-2 align-top">
                          <div className="font-semibold text-foreground">{row.dbLabel}</div>
                          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{row.dbField}</div>
                        </td>
                        <td className="border-r border-border/40 px-3 py-2 align-top text-foreground">
                          <div className="whitespace-pre-wrap break-words">{row.dbValue}</div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Badge className={cn('border text-[10px]', meta.className)}>{meta.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
