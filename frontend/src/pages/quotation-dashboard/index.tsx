import { useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from 'date-fns'

import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { apiClient } from '@/lib/api/client'

interface HistoryStats {
  tong_bg: number
  tong_sp: number
  tong_tien: number
  so_kh: number
  da_chot: number
  da_gui: number
  thua: number
}

interface QuotationEntry {
  id: number
  quote_number: string
  quote_date: string
  customer_name: string
  tong_cong: number
  product_count: number
  status: 'DA_GUI' | 'DA_CHOT' | 'THUA'
  status_display: string
  created_at: string
}

const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd')

const fmMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

const fmCompact = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}T`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Tr`
  return value.toLocaleString('vi-VN')
}

const fmVNDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: '-', time: '-' }

  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    date: `${byType.day}/${byType.month}/${byType.year}`,
    time: `${byType.hour}:${byType.minute}`,
  }
}

const STATUS_CHART_META = {
  DA_CHOT: {
    label: 'Đã chốt',
    color: '#28c76f',
    soft: 'rgba(40, 199, 111, 0.14)',
  },
  DA_GUI: {
    label: 'Đang gửi',
    color: '#00bad1',
    soft: 'rgba(0, 186, 209, 0.14)',
  },
  THUA: {
    label: 'Thua',
    color: '#ff4c51',
    soft: 'rgba(255, 76, 81, 0.14)',
  },
} satisfies Record<QuotationEntry['status'], { label: string; color: string; soft: string }>

const safeDate = (quote: QuotationEntry) => {
  const source = quote.created_at || quote.quote_date
  const parsed = parseISO(source)
  return Number.isNaN(parsed.getTime()) ? new Date(source) : parsed
}

function useStats(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['quotations', 'dashboard', 'stats', dateFrom, dateTo],
    queryFn: async (): Promise<HistoryStats> => {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
      const { data } = await apiClient.get<HistoryStats>(`/quotations/history/stats/?${params}`)
      return data
    },
    staleTime: 30_000,
  })
}

function useQuotationRange(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['quotations', 'dashboard', 'range', dateFrom, dateTo],
    queryFn: async (): Promise<Array<QuotationEntry>> => {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
      const { data } = await apiClient.get<Array<QuotationEntry>>(`/quotations/history/?${params}`)
      return data
    },
    staleTime: 30_000,
  })
}

function MetricCard({
  label,
  value,
  sub,
  icon,
  highlight,
}: {
  label: string
  value: string | number
  sub: string
  icon: ReactNode
  highlight?: boolean
}) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="text-muted-foreground/55">{icon}</span>
        </div>
        <div className={highlight ? 'text-2xl font-extrabold text-[#28c76f]' : 'text-2xl font-extrabold text-foreground'}>
          {value}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status, label }: { status: QuotationEntry['status']; label: string }) {
  const className = {
    DA_GUI: 'border-[#00bad1]/30 bg-[#00bad1]/10 text-[#00bad1]',
    DA_CHOT: 'border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]',
    THUA: 'border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]',
  }[status]

  return <Badge className={`border text-[10px] ${className}`}>{label}</Badge>
}

function QuarterTrendChart({
  quotes,
  dateFrom,
  dateTo,
  isLoading,
}: {
  quotes: Array<QuotationEntry>
  dateFrom: string
  dateTo: string
  isLoading: boolean
}) {
  const trend = useMemo(() => {
    const start = parseISO(dateFrom)
    const end = parseISO(dateTo)
    const totalDays = Math.max(1, differenceInCalendarDays(end, start) + 1)
    const bucketCount = Math.min(12, Math.max(6, Math.ceil(totalDays / 9)))
    const bucketSize = Math.ceil(totalDays / bucketCount)

    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = addDays(start, index * bucketSize)
      const bucketEnd = addDays(start, Math.min(totalDays - 1, (index + 1) * bucketSize - 1))
      return {
        label: format(bucketStart, 'dd/MM'),
        range: `${format(bucketStart, 'dd/MM')} - ${format(bucketEnd, 'dd/MM')}`,
        value: 0,
        count: 0,
      }
    })

    quotes.forEach((quote) => {
      const quoteDate = safeDate(quote)
      const dayIndex = differenceInCalendarDays(quoteDate, start)
      if (dayIndex < 0 || dayIndex >= totalDays) return
      const bucketIndex = Math.min(buckets.length - 1, Math.floor(dayIndex / bucketSize))
      buckets[bucketIndex].value += Number(quote.tong_cong || 0)
      buckets[bucketIndex].count += 1
    })

    return buckets
  }, [dateFrom, dateTo, quotes])

  const totalValue = trend.reduce((sum, point) => sum + point.value, 0)
  const totalCount = trend.reduce((sum, point) => sum + point.count, 0)
  const maxValue = Math.max(...trend.map((point) => point.value), 1)
  const maxCount = Math.max(...trend.map((point) => point.count), 1)

  const width = 760
  const height = 260
  const pad = { top: 24, right: 28, bottom: 42, left: 54 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const step = innerW / Math.max(trend.length, 1)
  const bottomY = pad.top + innerH

  const linePoints = trend.map((point, index) => {
    const x = pad.left + step * index + step / 2
    const y = bottomY - (point.count / maxCount) * innerH
    return { x, y }
  })
  const linePath = linePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <Card className="overflow-hidden border-border/60 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-[#7367f0]" />
            Xu hướng trong quý
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalCount} báo giá - {fmMoney(totalValue)}
          </p>
        </div>
        <div className="flex gap-2 text-[11px] font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#ff9f43]" />
            Số BG
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <Skeleton className="h-[260px] rounded-lg" />
        ) : (
          <div className="rounded-lg border border-border/60 bg-[#fbfbfd] p-3">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full" role="img" aria-label="Xu hướng báo giá trong quý">
              {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                const y = pad.top + innerH * tick
                return (
                  <g key={tick}>
                    <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e9e7ef" strokeWidth="1" />
                    <text x={pad.left - 10} y={y + 4} textAnchor="end" fontSize="11" fontWeight="700" fill="#a8a4b3">
                      {tick === 0 ? fmCompact(maxValue) : tick === 1 ? '0' : ''}
                    </text>
                  </g>
                )
              })}

              {trend.map((point, index) => {
                const x = pad.left + step * index + step / 2

                return (
                  <g key={point.range}>
                    <text x={x} y={height - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#8f8a9d">
                      {index % 2 === 0 || trend.length <= 8 ? point.label : ''}
                    </text>
                  </g>
                )
              })}

              {linePath && (
                <>
                  <path d={linePath} fill="none" stroke="#ff9f43" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {linePoints.map((point, index) => (
                    <circle key={trend[index].range} cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#ff9f43" strokeWidth="2.5" />
                  ))}
                </>
              )}
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusDonutChart({
  stats,
  isLoading,
}: {
  stats: HistoryStats | undefined
  isLoading: boolean
}) {
  const items = (['DA_CHOT', 'DA_GUI', 'THUA'] as const).map((key) => ({
    key,
    ...STATUS_CHART_META[key],
    value: key === 'DA_CHOT' ? stats?.da_chot ?? 0 : key === 'DA_GUI' ? stats?.da_gui ?? 0 : stats?.thua ?? 0,
  }))
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const closeRate = total > 0 ? Math.round(((stats?.da_chot ?? 0) / total) * 100) : 0
  const radius = 58
  const circumference = 2 * Math.PI * radius
  let offset = 0
  const segments = items.map((item) => {
    const length = total > 0 ? (item.value / total) * circumference : 0
    const segment = { ...item, length, offset: -offset }
    offset += length
    return segment
  })

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-[#28c76f]" />
          Cơ cấu trạng thái
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] rounded-lg" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-[180px_1fr] lg:grid-cols-1 xl:grid-cols-[180px_1fr]">
            <div className="relative mx-auto h-[180px] w-[180px]">
              <svg viewBox="0 0 180 180" className="h-full w-full">
                <circle cx="90" cy="90" r={radius} fill="none" stroke="#eceaf2" strokeWidth="18" />
                {segments.map((segment) => (
                  <circle
                    key={segment.key}
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="18"
                    strokeDasharray={`${segment.length} ${circumference}`}
                    strokeDashoffset={segment.offset}
                    strokeLinecap="round"
                    transform="rotate(-90 90 90)"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-extrabold text-foreground">{closeRate}%</div>
                <div className="text-xs font-semibold text-muted-foreground">tỉ lệ chốt</div>
              </div>
            </div>

            <div className="space-y-2.5">
              {items.map((item) => {
                const percent = total > 0 ? Math.round((item.value / total) * 100) : 0
                return (
                  <div key={item.key} className="rounded-lg border border-border/60 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                        {item.label}
                      </span>
                      <span className="font-bold tabular-nums">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percent}%`, background: item.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function QuotationDashboardPage() {
  const navigate = useNavigate()
  const now = useMemo(() => new Date(), [])
  const ranges = useMemo(() => ({
    month: {
      label: 'Tháng này',
      from: toApiDate(startOfMonth(now)),
      to: toApiDate(endOfMonth(now)),
    },
    quarter: {
      label: 'Quý này',
      from: toApiDate(startOfQuarter(now)),
      to: toApiDate(endOfQuarter(now)),
    },
    year: {
      label: 'Năm nay',
      from: toApiDate(startOfYear(now)),
      to: toApiDate(endOfYear(now)),
    },
  }), [now])

  const monthStats = useStats(ranges.month.from, ranges.month.to)
  const quarterStats = useStats(ranges.quarter.from, ranges.quarter.to)
  const yearStats = useStats(ranges.year.from, ranges.year.to)
  const quarterQuotes = useQuotationRange(ranges.quarter.from, ranges.quarter.to)
  const activeStats = quarterStats.data
  const closeRate = activeStats?.tong_bg ? Math.round((activeStats.da_chot / activeStats.tong_bg) * 100) : 0
  const recentQuotes = quarterQuotes.data ?? []

  const headerStats = (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Dashboard</div>
      <div className="text-sm font-bold text-foreground">Báo giá</div>
    </div>
  )

  return (
    <div className="quotation-page-bg min-h-screen">
      <AppHeader stats={headerStats} />
      <main className="mx-auto max-w-[1500px] space-y-4 px-4 py-4 md:px-5">
        <Card className="border-border/50 bg-card shadow-sm">
          <CardContent className="flex flex-wrap items-center gap-3 p-3.5">
            <BarChart3 className="h-5 w-5 text-[#ff9f43]" />
            <div className="min-w-[190px]">
              <p className="text-sm font-semibold text-foreground">Dashboard báo giá</p>
              <p className="text-xs text-muted-foreground">{ranges.quarter.from} - {ranges.quarter.to}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/bao-gia')}>
              <CalendarDays className="h-4 w-4" />
              Về lịch
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
              Trang chính
            </Button>
          </CardContent>
        </Card>

        {quarterStats.isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Tổng báo giá" value={activeStats?.tong_bg ?? 0} sub={`${activeStats?.da_gui ?? 0} đang gửi`} icon={<FileText className="h-5 w-5" />} />
            <MetricCard label="Khách hàng" value={activeStats?.so_kh ?? 0} sub="KH duy nhất" icon={<Users className="h-5 w-5" />} />
            <MetricCard label="Tổng giá trị" value={fmCompact(activeStats?.tong_tien ?? 0)} sub={fmMoney(activeStats?.tong_tien ?? 0)} icon={<DollarSign className="h-5 w-5" />} highlight />
            <MetricCard label="Tỉ lệ chốt" value={`${closeRate}%`} sub={`${activeStats?.tong_sp ?? 0} sản phẩm`} icon={<TrendingUp className="h-5 w-5" />} />
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
          <QuarterTrendChart
            quotes={quarterQuotes.data ?? []}
            dateFrom={ranges.quarter.from}
            dateTo={ranges.quarter.to}
            isLoading={quarterQuotes.isLoading}
          />
          <StatusDonutChart stats={activeStats} isLoading={quarterStats.isLoading} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { key: 'month', query: monthStats, icon: <CalendarDays className="h-4 w-4" /> },
            { key: 'quarter', query: quarterStats, icon: <BarChart3 className="h-4 w-4" /> },
            { key: 'year', query: yearStats, icon: <TrendingUp className="h-4 w-4" /> },
          ].map((item) => {
            const range = ranges[item.key as keyof typeof ranges]
            const data = item.query.data
            return (
              <Card key={item.key} className="border-border/60 bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {item.icon}
                    {range.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {item.query.isLoading ? (
                    <Skeleton className="h-20 rounded-lg" />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Báo giá</span>
                        <span className="font-bold">{data?.tong_bg ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Đã chốt</span>
                        <span className="font-bold text-[#28c76f]">{data?.da_chot ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Thua</span>
                        <span className="font-bold text-[#ff4c51]">{data?.thua ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-3">
                        <span className="text-muted-foreground">Giá trị</span>
                        <span className="font-bold">{fmMoney(data?.tong_tien ?? 0)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-[#ff9f43]" />
              Báo giá gần đây trong quý
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quarterQuotes.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-lg" />)}
              </div>
            ) : recentQuotes.length ? (
              <div className="max-h-[430px] overflow-auto rounded-lg border border-border/70">
                <Table className="min-w-[980px]">
                  <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                    <TableRow className="hover:bg-muted/95">
                      <TableHead className="h-10 px-3 text-xs font-bold uppercase">Số báo giá</TableHead>
                      <TableHead className="h-10 px-3 text-xs font-bold uppercase">Ngày</TableHead>
                      <TableHead className="h-10 px-3 text-xs font-bold uppercase">Giờ VN</TableHead>
                      <TableHead className="h-10 px-3 text-xs font-bold uppercase">Khách hàng</TableHead>
                      <TableHead className="h-10 px-3 text-right text-xs font-bold uppercase">SP</TableHead>
                      <TableHead className="h-10 px-3 text-right text-xs font-bold uppercase">Giá trị</TableHead>
                      <TableHead className="h-10 px-3 text-center text-xs font-bold uppercase">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentQuotes.map((quote) => {
                      const vnDateTime = fmVNDateTime(quote.created_at || quote.quote_date)

                      return (
                        <TableRow key={quote.id} className="bg-card/80">
                          <TableCell className="px-3 py-3 font-mono text-xs font-bold text-[#7367f0]">
                            {quote.quote_number}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm font-semibold tabular-nums text-foreground">
                            {vnDateTime.date}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm font-semibold tabular-nums text-muted-foreground">
                            {vnDateTime.time}
                          </TableCell>
                          <TableCell className="max-w-[420px] px-3 py-3">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {quote.customer_name || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                            {quote.product_count}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-sm font-bold tabular-nums">
                            {fmMoney(quote.tong_cong)}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-center">
                            <StatusBadge status={quote.status} label={quote.status_display} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Chưa có báo giá trong quý này.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
