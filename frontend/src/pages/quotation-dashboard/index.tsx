import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Send,
  Tag,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { apiClient } from '@/lib/api/client'

type TimeRange = 'day' | 'week' | 'month'
type QuotationStatus = 'DA_GUI' | 'DA_CHOT' | 'THUA'

interface QuotationEntry {
  id: number
  quote_number: string
  quote_date: string
  customer_name: string
  tong_cong: number | string
  product_count: number
  nhan_vien: string
  status: QuotationStatus
  status_display: string
  ghi_chu: string
  created_at: string
}

interface TrendPoint {
  label: string
  revenue: number
  commission: number
  count: number
}

interface DashboardData {
  totalSent: number
  successful: number
  rejected: number
  pending: number
  conversionRate: number
  revenue: number
  commission: number
  sentTrend: Array<TrendPoint>
  recentQuotes: Array<QuotationEntry>
}

const STATUS_META: Record<
  QuotationStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  DA_GUI: {
    label: 'Đã gửi',
    className: 'border-[#00bad1]/30 bg-[#00bad1]/10 text-[#00bad1]',
    icon: <Send className="h-3.5 w-3.5" />,
  },
  DA_CHOT: {
    label: 'Đã chốt',
    className: 'border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  THUA: {
    label: 'Thua',
    className: 'border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
}

const PERIOD_LABEL: Record<TimeRange, string> = {
  day: 'Hôm nay',
  week: 'Tuần này',
  month: 'Tháng này',
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const pad2 = (value: number) => String(value).padStart(2, '0')

const toApiDate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

const toDisplayDate = (date: Date) =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`

const startOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const getRange = (period: TimeRange) => {
  const now = startOfDay(new Date())
  const from = new Date(now)
  const to = new Date(now)

  if (period === 'week') {
    const mondayOffset = (now.getDay() + 6) % 7
    from.setDate(now.getDate() - mondayOffset)
    to.setDate(from.getDate() + 6)
  }

  if (period === 'month') {
    from.setDate(1)
    to.setMonth(from.getMonth() + 1, 0)
  }

  return {
    from,
    to,
    dateFrom: toApiDate(from),
    dateTo: toApiDate(to),
    label:
      period === 'day'
        ? `Hôm nay (${toDisplayDate(now)})`
        : `${PERIOD_LABEL[period]} (${toDisplayDate(from)} - ${toDisplayDate(to)})`,
  }
}

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const quoteValue = (quote: QuotationEntry) => Number(quote.tong_cong || 0)

const fmMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

const fmCompact = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} triệu`
  return value.toLocaleString('vi-VN')
}

function useDashboardQuotes(range: ReturnType<typeof getRange>) {
  return useQuery({
    queryKey: ['quotations', 'dashboard', range.dateFrom, range.dateTo],
    queryFn: async (): Promise<Array<QuotationEntry>> => {
      const params = new URLSearchParams({
        date_from: range.dateFrom,
        date_to: range.dateTo,
      })
      const { data } = await apiClient.get<Array<QuotationEntry>>(`/quotations/history/?${params}`)
      return data
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

function buildTrend(period: TimeRange, quotes: Array<QuotationEntry>, range: ReturnType<typeof getRange>) {
  const addQuote = (bucket: TrendPoint, quote: QuotationEntry) => {
    bucket.count += 1
    if (quote.status !== 'DA_CHOT') return

    const revenue = quoteValue(quote)
    bucket.revenue += revenue
    bucket.commission += revenue * 0.1
  }

  if (period === 'day') {
    const buckets = [0, 4, 8, 12, 16, 20].map((hour) => ({
      label: `${pad2(hour)}h`,
      revenue: 0,
      commission: 0,
      count: 0,
    }))

    quotes.forEach((quote) => {
      const createdAt = quote.created_at ? new Date(quote.created_at) : parseLocalDate(quote.quote_date)
      addQuote(buckets[Math.min(Math.floor(createdAt.getHours() / 4), buckets.length - 1)], quote)
    })

    return buckets
  }

  if (period === 'week') {
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    const buckets = labels.map((label) => ({ label, revenue: 0, commission: 0, count: 0 }))
    const start = startOfDay(range.from).getTime()

    quotes.forEach((quote) => {
      const quoteDate = startOfDay(parseLocalDate(quote.quote_date)).getTime()
      const index = Math.min(Math.max(Math.round((quoteDate - start) / 86_400_000), 0), 6)
      addQuote(buckets[index], quote)
    })

    return buckets
  }

  const lastDay = range.to.getDate()
  const bucketCount = Math.ceil(lastDay / 7)
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    label: `Tuần ${index + 1}`,
    revenue: 0,
    commission: 0,
    count: 0,
  }))

  quotes.forEach((quote) => {
    const quoteDate = parseLocalDate(quote.quote_date)
    const index = Math.min(Math.floor((quoteDate.getDate() - 1) / 7), buckets.length - 1)
    addQuote(buckets[index], quote)
  })

  return buckets
}

function buildDashboardData(
  period: TimeRange,
  quotes: Array<QuotationEntry>,
  range: ReturnType<typeof getRange>,
): DashboardData {
  const sortedQuotes = [...quotes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  const successful = sortedQuotes.filter((quote) => quote.status === 'DA_CHOT')
  const rejected = sortedQuotes.filter((quote) => quote.status === 'THUA')
  const pending = sortedQuotes.filter((quote) => quote.status === 'DA_GUI')
  const revenue = successful.reduce((sum, quote) => sum + quoteValue(quote), 0)

  return {
    totalSent: sortedQuotes.length,
    successful: successful.length,
    rejected: rejected.length,
    pending: pending.length,
    conversionRate: sortedQuotes.length > 0 ? Math.round((successful.length / sortedQuotes.length) * 100) : 0,
    revenue,
    commission: revenue * 0.1,
    sentTrend: buildTrend(period, sortedQuotes, range),
    recentQuotes: sortedQuotes,
  }
}

function StatusBadge({ status, label }: { status: QuotationStatus; label?: string }) {
  const meta = STATUS_META[status]
  return (
    <Badge className={`border text-[10px] font-bold ${meta.className}`}>
      {label || meta.label}
    </Badge>
  )
}

function SpeedometerGauge({ value }: { value: number }) {
  const totalTicks = 20
  const activeTicks = Math.round((value / 100) * totalTicks)
  const center = { x: 150, y: 160 }
  const r1 = 90
  const r2 = 110
  const needleAngle = -150 + (value / 100) * 120
  const needleRad = (needleAngle * Math.PI) / 180
  const needleX = center.x + 80 * Math.cos(needleRad)
  const needleY = center.y + 80 * Math.sin(needleRad)

  return (
    <div className="relative mx-auto h-[200px] w-[300px]">
      <svg viewBox="0 0 300 200" className="h-full w-full">
        {Array.from({ length: totalTicks }).map((_, index) => {
          const angle = -150 + (index / (totalTicks - 1)) * 120
          const rad = (angle * Math.PI) / 180
          return (
            <line
              key={index}
              x1={center.x + r1 * Math.cos(rad)}
              y1={center.y + r1 * Math.sin(rad)}
              x2={center.x + r2 * Math.cos(rad)}
              y2={center.y + r2 * Math.sin(rad)}
              stroke={index < activeTicks ? '#E41F07' : '#e9e7ef'}
              strokeWidth="6.5"
              strokeLinecap="round"
            />
          )
        })}
        <line
          x1={center.x}
          y1={center.y}
          x2={needleX}
          y2={needleY}
          stroke="#2d3748"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={center.x} cy={center.y} r="7" fill="#2d3748" stroke="#fff" strokeWidth="2" />
      </svg>
    </div>
  )
}

function ConcentricRings({ wonPercent, lostPercent }: { wonPercent: number; lostPercent: number }) {
  const center = 70
  const strokeWidth = 9
  const rWon = 38
  const rLost = 26
  const circWon = 2 * Math.PI * rWon
  const circLost = 2 * Math.PI * rLost

  return (
    <div className="mx-auto flex h-[140px] w-[140px] items-center justify-center">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx={center} cy={center} r={rWon} fill="none" stroke="#fff5eb" strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={rLost} fill="none" stroke="#ffebeb" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={rWon}
          fill="none"
          stroke="#28c76f"
          strokeWidth={strokeWidth}
          strokeDasharray={circWon}
          strokeDashoffset={circWon * (1 - wonPercent / 100)}
          strokeLinecap="round"
        />
        <circle
          cx={center}
          cy={center}
          r={rLost}
          fill="none"
          stroke="#ff4c51"
          strokeWidth={strokeWidth}
          strokeDasharray={circLost}
          strokeDashoffset={circLost * (1 - lostPercent / 100)}
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export default function QuotationDashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const range = useMemo(() => getRange(timeRange), [timeRange])
  const quotesQuery = useDashboardQuotes(range)

  const agents = useMemo(() => {
    const names = new Set(
      (quotesQuery.data ?? [])
        .map((quote) => quote.nhan_vien?.trim())
        .filter((name): name is string => Boolean(name)),
    )
    return ['all', ...Array.from(names).sort((a, b) => a.localeCompare(b, 'vi'))]
  }, [quotesQuery.data])

  const filteredQuotes = useMemo(() => {
    const quotes = quotesQuery.data ?? []
    if (selectedAgent === 'all') return quotes
    return quotes.filter((quote) => quote.nhan_vien?.trim() === selectedAgent)
  }, [quotesQuery.data, selectedAgent])

  const data = useMemo(
    () => buildDashboardData(timeRange, filteredQuotes, range),
    [filteredQuotes, range, timeRange],
  )

  const totalPages = Math.max(Math.ceil(data.recentQuotes.length / pageSize), 1)

  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize, selectedAgent, timeRange])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const pageStartIndex = (currentPage - 1) * pageSize
  const paginatedQuotes = data.recentQuotes.slice(pageStartIndex, pageStartIndex + pageSize)
  const pageStart = data.recentQuotes.length === 0 ? 0 : pageStartIndex + 1
  const pageEnd = Math.min(pageStartIndex + pageSize, data.recentQuotes.length)

  const updateStatusMutation = useMutation({
    mutationFn: async ({ quote, status }: { quote: QuotationEntry; status: QuotationStatus }) => {
      const { data: responseData } = await apiClient.patch(`/quotations/${quote.id}/update/`, {
        status,
        ghi_chu: quote.ghi_chu ?? '',
        nhan_vien: quote.nhan_vien ?? '',
      })
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Đã cập nhật trạng thái báo giá')
    },
    onError: () => toast.error('Không thể cập nhật báo giá, vui lòng thử lại'),
  })

  const trend = data.sentTrend
  const maxRevenue = useMemo(() => Math.max(...trend.map((point) => point.revenue), 1), [trend])
  const chartW = 760
  const chartH = 180
  const pad = { top: 20, right: 30, bottom: 30, left: 60 }
  const innerW = chartW - pad.left - pad.right
  const innerH = chartH - pad.top - pad.bottom
  const step = innerW / Math.max(trend.length - 1, 1)
  const bottomY = pad.top + innerH

  const revenuePoints = useMemo(
    () =>
      trend.map((point, index) => ({
        x: pad.left + step * index,
        y: bottomY - (point.revenue / maxRevenue) * innerH,
      })),
    [bottomY, innerH, maxRevenue, step, trend],
  )
  const commissionPoints = useMemo(
    () =>
      trend.map((point, index) => ({
        x: pad.left + step * index,
        y: bottomY - (point.commission / maxRevenue) * innerH,
      })),
    [bottomY, innerH, maxRevenue, step, trend],
  )
  const revenuePath = revenuePoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const commissionPath = commissionPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const wonPercent = data.totalSent > 0 ? Math.round((data.successful / data.totalSent) * 100) : 0
  const lostPercent = data.totalSent > 0 ? Math.round((data.rejected / data.totalSent) * 100) : 0
  const isUpdating = updateStatusMutation.isPending

  return (
    <div className="animate-in fade-in space-y-6 p-4 duration-300 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Báo cáo hiệu quả kinh doanh
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Số liệu lấy trực tiếp từ lịch sử báo giá và tự cập nhật khi đổi trạng thái.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-bold shadow-xs">
                <User className="h-3.5 w-3.5 text-primary" />
                {selectedAgent === 'all' ? 'Tất cả nhân viên' : selectedAgent}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {agents.map((agent) => (
                <DropdownMenuItem key={agent} onClick={() => setSelectedAgent(agent)}>
                  {agent === 'all' ? 'Tất cả nhân viên' : agent}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs">
            <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-[11px] tabular-nums">{range.label}</span>
          </div>

          <Button variant="outline" size="sm" className="gap-1.5 shadow-xs" onClick={() => navigate('/bao-gia')}>
            Lịch sử báo giá
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3 shadow-xs">
          <div className="flex min-w-0 items-center gap-2">
            <span className="mr-2 hidden text-xs font-bold uppercase tracking-wider text-muted-foreground sm:inline">
              Chu kỳ báo cáo:
            </span>
            <div className="flex shrink-0 rounded-lg border border-border bg-muted/30 p-0.5 text-xs font-bold">
              {(['day', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  className={`h-7 rounded-md px-4 transition-all ${
                    timeRange === period ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setTimeRange(period)}
                >
                  {PERIOD_LABEL[period]}
                </button>
              ))}
            </div>
          </div>
          <span className="hidden items-center gap-1 text-[11px] italic text-muted-foreground md:flex">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/80" />
            Refresh tự động mỗi 30 giây
          </span>
        </div>

        {quotesQuery.isError && (
          <Card className="border-red-200 bg-red-50 text-red-700">
            <CardContent className="p-4 text-sm font-semibold">
              Không tải được dữ liệu báo giá. Kiểm tra backend rồi bấm refresh.
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Báo giá đã gửi
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <FileText className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
                {quotesQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : data.totalSent}
                <span className="ml-1 text-xs font-medium text-muted-foreground">bản</span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
                <Badge className="h-4 border-0 bg-blue-500/10 px-1 py-0 text-[9px] font-extrabold text-blue-600">
                  Chờ chốt: {data.pending}
                </Badge>
                <span>Đang chờ phản hồi</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Chốt đơn / Thua
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1.5 text-2xl font-extrabold tracking-tight tabular-nums">
                <span className="text-green-600">{data.successful}</span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-lg text-red-500">{data.rejected}</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground/80">
                Tỷ lệ chốt thành công: <span className="font-bold text-green-600">{data.conversionRate}%</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Doanh số đã chốt
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Tag className="h-4.5 w-4.5 fill-current" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold tracking-tight text-foreground tabular-nums">
                {fmMoney(data.revenue)}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground/80">Chỉ tính các báo giá ở trạng thái đã chốt</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                Thực nhận của bạn
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold tracking-tight text-primary tabular-nums">
                {fmMoney(data.commission)}
              </div>
              <p className="mt-1 text-[10px] text-primary/80">
                Tạm tính 10% trên doanh số đã chốt
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-foreground">
                    <BarChart3 className="h-4.5 w-4.5 text-primary" />
                    Biểu đồ doanh số & thực nhận
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground">
                    Đường doanh số chỉ lấy những báo giá đã chốt thành công
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-3 rounded-full bg-[#28c76f]" />
                    <span className="text-muted-foreground">Doanh số chốt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-3 rounded-full bg-[#ff9f43]" />
                    <span className="text-muted-foreground">Thực nhận 10%</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-2">
              <div className="rounded-xl border border-border/60 bg-muted/10 p-2.5">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-[180px] w-full">
                  {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                    const y = pad.top + innerH * tick
                    return (
                      <g key={tick}>
                        <line x1={pad.left} x2={chartW - pad.right} y1={y} y2={y} stroke="rgba(0,0,0,0.06)" />
                        <text x={pad.left - 10} y={y + 4} textAnchor="end" fontSize="9" fontWeight="700" fill="#a8a4b3">
                          {tick === 0 ? fmCompact(maxRevenue) : tick === 1 ? '0' : ''}
                        </text>
                      </g>
                    )
                  })}
                  {trend.map((point, index) => {
                    const x = pad.left + step * index
                    return (
                      <text key={point.label} x={x} y={chartH - 8} textAnchor="middle" fontSize="9" fontWeight="700" fill="#8f8a9d">
                        {point.label}
                      </text>
                    )
                  })}
                  {revenuePath && (
                    <>
                      <path d={revenuePath} fill="none" stroke="#28c76f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      {revenuePoints.map((point, index) => (
                        <circle key={`rev-${index}`} cx={point.x} cy={point.y} r="3.5" fill="#fff" stroke="#28c76f" strokeWidth="2.5" />
                      ))}
                    </>
                  )}
                  {commissionPath && (
                    <>
                      <path d={commissionPath} fill="none" stroke="#ff9f43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" />
                      {commissionPoints.map((point, index) => (
                        <circle key={`com-${index}`} cx={point.x} cy={point.y} r="3" fill="#fff" stroke="#ff9f43" strokeWidth="2" />
                      ))}
                    </>
                  )}
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between border-border/60 bg-card shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                Tỷ lệ chốt đơn
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Hiệu quả chốt báo giá trong chu kỳ đang xem</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
              <SpeedometerGauge value={data.conversionRate} />
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                <span className="text-sm font-extrabold text-foreground">{data.conversionRate}%</span>
                <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold text-green-600">
                  {data.successful} đơn
                </span>
                <span className="text-[10px] text-muted-foreground">đã chốt thành công</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Báo giá phát sinh gần đây
                </CardTitle>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {data.recentQuotes.length} báo giá trong chu kỳ đang xem
                </p>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2 text-xs font-bold">
                      {pageSize} dòng
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <DropdownMenuItem key={size} onClick={() => setPageSize(size)}>
                        {size} dòng / trang
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => quotesQuery.refetch()}
                  disabled={quotesQuery.isFetching}
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${quotesQuery.isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[520px] overflow-auto border-y border-border/60">
                <Table className="min-w-[680px]">
                  <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                    <TableRow>
                      <TableHead className="h-9 px-3.5 text-[10px] font-bold uppercase tracking-wider">Báo giá</TableHead>
                      <TableHead className="h-9 px-3.5 text-[10px] font-bold uppercase tracking-wider">Khách hàng</TableHead>
                      <TableHead className="h-9 px-3.5 text-[10px] font-bold uppercase tracking-wider">Nhân viên</TableHead>
                      <TableHead className="h-9 px-3.5 text-right text-[10px] font-bold uppercase tracking-wider">Giá trị</TableHead>
                      <TableHead className="h-9 px-3.5 text-center text-[10px] font-bold uppercase tracking-wider">Trạng thái</TableHead>
                      <TableHead className="h-9 px-3.5 text-right text-[10px] font-bold uppercase tracking-wider">Cập nhật</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotesQuery.isLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                          Đang tải dữ liệu báo giá...
                        </TableCell>
                      </TableRow>
                    )}

                    {!quotesQuery.isLoading && data.recentQuotes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                          Chưa có báo giá trong chu kỳ này.
                        </TableCell>
                      </TableRow>
                    )}

                    {paginatedQuotes.map((quote) => (
                      <TableRow key={quote.id} className="border-b border-border/40 hover:bg-muted/30">
                        <TableCell className="px-3.5 py-2.5 font-mono text-xs font-bold text-primary">
                          {quote.quote_number}
                        </TableCell>
                        <TableCell className="px-3.5 py-2.5 text-xs font-semibold text-foreground">
                          {quote.customer_name || 'Khách lẻ'}
                        </TableCell>
                        <TableCell className="px-3.5 py-2.5 text-xs text-muted-foreground">
                          {quote.nhan_vien || 'Chưa nhập'}
                        </TableCell>
                        <TableCell className="px-3.5 py-2.5 text-right text-xs font-bold tabular-nums text-foreground">
                          {fmMoney(quoteValue(quote))}
                        </TableCell>
                        <TableCell className="px-3.5 py-2.5 text-center">
                          <StatusBadge status={quote.status} label={quote.status_display} />
                        </TableCell>
                        <TableCell className="px-3.5 py-2.5 text-right">
                          <div className="flex justify-end gap-1.5">
                            {quote.status !== 'DA_CHOT' && (
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 px-2.5 text-xs"
                                disabled={isUpdating}
                                onClick={() => updateStatusMutation.mutate({ quote, status: 'DA_CHOT' })}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Chốt
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8" disabled={isUpdating}>
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {(Object.keys(STATUS_META) as Array<QuotationStatus>).map((status) => (
                                  <DropdownMenuItem
                                    key={status}
                                    disabled={quote.status === status}
                                    onClick={() => updateStatusMutation.mutate({ quote, status })}
                                  >
                                    <span className="mr-2">{STATUS_META[status].icon}</span>
                                    {STATUS_META[status].label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-2 px-3.5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Hiển thị {pageStart}-{pageEnd} / {data.recentQuotes.length} báo giá
                </span>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-[72px] text-center font-mono text-[11px] font-bold text-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between border-border/60 bg-card shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                Kết quả chốt báo giá
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Tỷ lệ đơn chốt thành công và đơn thua</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center gap-4">
              <div className="flex h-[140px] items-center justify-center">
                <ConcentricRings wonPercent={wonPercent} lostPercent={lostPercent} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-border/85 bg-card p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded bg-[#28c76f]" />
                    <span className="text-[11px] font-bold text-foreground">Đã chốt</span>
                  </div>
                  <span className="text-xs font-bold text-green-600">
                    {data.successful} đơn ({wonPercent}%)
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/85 bg-card p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded bg-[#ff4c51]" />
                    <span className="text-[11px] font-bold text-foreground">Thua</span>
                  </div>
                  <span className="text-xs font-bold text-red-500">
                    {data.rejected} đơn ({lostPercent}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
