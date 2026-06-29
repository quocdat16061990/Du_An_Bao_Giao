import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  CalendarDays,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  Tag,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} triệu`
  return value.toLocaleString('vi-VN')
}

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

function StatusBadge({ status, label }: { status: QuotationEntry['status']; label: string }) {
  const className = {
    DA_GUI: 'border-[#00bad1]/30 bg-[#00bad1]/10 text-[#00bad1]',
    DA_CHOT: 'border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]',
    THUA: 'border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]',
  }[status]

  return <Badge className={`border text-[10px] ${className}`}>{label}</Badge>
}

/* ── Speedometer Gauge for Conversion Rate ── */
function SpeedometerGauge({ value }: { value: number }) {
  const totalTicks = 20
  const activeTicks = Math.round((value / 100) * totalTicks)
  const center = { x: 150, y: 160 }
  const r1 = 90
  const r2 = 110
  
  const ticks = Array.from({ length: totalTicks }).map((_, idx) => {
    const angle = -150 + (idx / (totalTicks - 1)) * 120
    const rad = (angle * Math.PI) / 180
    const x1 = center.x + r1 * Math.cos(rad)
    const y1 = center.y + r1 * Math.sin(rad)
    const x2 = center.x + r2 * Math.cos(rad)
    const y2 = center.y + r2 * Math.sin(rad)
    const isActive = idx < activeTicks
    return (
      <line
        key={idx}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isActive ? '#E41F07' : '#e9e7ef'}
        strokeWidth="6.5"
        strokeLinecap="round"
      />
    )
  })

  // Needle angle
  const needleAngle = -150 + (value / 100) * 120
  const needleRad = (needleAngle * Math.PI) / 180
  const needleLen = 80
  const needleX = center.x + needleLen * Math.cos(needleRad)
  const needleY = center.y + needleLen * Math.sin(needleRad)

  const labelValues = [0, 20, 40, 60, 80, 100]

  return (
    <div className="relative mx-auto h-[200px] w-[300px]">
      <svg viewBox="0 0 300 200" className="h-full w-full">
        {/* Background ticks */}
        {ticks}

        {/* Needle Line */}
        <line
          x1={center.x}
          y1={center.y}
          x2={needleX}
          y2={needleY}
          stroke="#2d3748"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Center pin */}
        <circle cx={center.x} cy={center.y} r="7" fill="#2d3748" stroke="#fff" strokeWidth="2" />

        {/* Text values along the scale */}
        {labelValues.map((val) => {
          const angle = -150 + (val / 100) * 120
          const rad = (angle * Math.PI) / 180
          const rLabel = 74
          const x = center.x + rLabel * Math.cos(rad)
          const y = center.y + rLabel * Math.sin(rad)
          return (
            <text
              key={val}
              x={x}
              y={y + 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#718096"
            >
              {val}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

/* ── Nested Concentric Rings for Won vs Lost ── */
function ConcentricRings({ wonPercent, lostPercent }: { wonPercent: number; lostPercent: number }) {
  const center = 70
  const strokeWidth = 9

  const rWon = 38
  const circWon = 2 * Math.PI * rWon
  const offsetWon = circWon * (1 - wonPercent / 100)

  const rLost = 26
  const circLost = 2 * Math.PI * rLost
  const offsetLost = circLost * (1 - lostPercent / 100)

  return (
    <div className="w-[140px] h-[140px] flex items-center justify-center mx-auto">
      <svg viewBox="0 0 140 140" className="w-full h-full transform -rotate-90">
        {/* Faded background tracks */}
        <circle cx={center} cy={center} r={rWon} fill="none" stroke="#fff5eb" strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={rLost} fill="none" stroke="#ffebeb" strokeWidth={strokeWidth} />

        {/* Won Ring (Orange) */}
        <circle
          cx={center}
          cy={center}
          r={rWon}
          fill="none"
          stroke="#ff9f43"
          strokeWidth={strokeWidth}
          strokeDasharray={circWon}
          strokeDashoffset={offsetWon}
          strokeLinecap="round"
        />

        {/* Lost Ring (Red) */}
        <circle
          cx={center}
          cy={center}
          r={rLost}
          fill="none"
          stroke="#E41F07"
          strokeWidth={strokeWidth}
          strokeDasharray={circLost}
          strokeDashoffset={offsetLost}
          strokeLinecap="round"
        />
      </svg>
    </div>
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

  const [revenuePeriod, setRevenuePeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly')
  const [recentPeriod, setRecentPeriod] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Weekly')

  const monthStats = useStats(ranges.month.from, ranges.month.to)
  const quarterStats = useStats(ranges.quarter.from, ranges.quarter.to)
  const yearStats = useStats(ranges.year.from, ranges.year.to)
  const quarterQuotes = useQuotationRange(ranges.quarter.from, ranges.quarter.to)

  const activeStats = quarterStats.data
  const recentQuotes = quarterQuotes.data ?? []

  // Trend calculations
  const trend = useMemo(() => {
    const start = parseISO(ranges.quarter.from)
    const end = parseISO(ranges.quarter.to)
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

    recentQuotes.forEach((quote) => {
      const quoteDate = safeDate(quote)
      const dayIndex = differenceInCalendarDays(quoteDate, start)
      if (dayIndex < 0 || dayIndex >= totalDays) return
      const bucketIndex = Math.min(buckets.length - 1, Math.floor(dayIndex / bucketSize))
      buckets[bucketIndex].value += Number(quote.tong_cong || 0)
      buckets[bucketIndex].count += 1
    })

    return buckets
  }, [ranges.quarter.from, ranges.quarter.to, recentQuotes])

  const maxCount = Math.max(...trend.map((point) => point.count), 1)

  const width = 760
  const height = 180
  const pad = { top: 15, right: 20, bottom: 30, left: 40 }
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

  const closeRate = useMemo(() => {
    if (!activeStats) return 0
    const total = activeStats.da_chot + activeStats.da_gui + activeStats.thua
    return total > 0 ? Math.round((activeStats.da_chot / total) * 100) : 0
  }, [activeStats])

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Báo cáo hiệu quả Báo giá
          </h1>
        </div>
        
        <div className="gap-2 flex items-center flex-wrap">
          <div className="border border-border px-3 py-1.5 rounded-lg flex items-center bg-card shadow-xs text-xs font-semibold text-foreground">
            <CalendarDays className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="tabular-nums">31 May 26 - 29 Jun 26</span>
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 shadow-xs" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 text-foreground" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 shadow-xs" onClick={() => navigate('/bao-gia')}>
            Về lịch báo giá
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] space-y-6">
        
        {/* ── ROW 1: Revenue (MTD & YTD) & Conversion Rate ── */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
          {/* Revenue Panel with Embedded Trend Chart */}
          <Card className="flex-fill bg-card border-border/60 shadow-xs">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h5 className="text-sm font-bold text-foreground">Tổng doanh số</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Thời gian lọc báo cáo hiện tại</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Revenue Tab selector */}
                  <div className="flex rounded-lg border border-border/70 bg-muted/40 p-0.5 shrink-0 text-[11px] font-bold">
                    {(['weekly', 'monthly', 'yearly'] as const).map((period) => (
                      <button
                        key={period}
                        className={`h-6 px-2.5 rounded-md capitalize transition-colors ${
                          revenuePeriod === period ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => setRevenuePeriod(period)}
                      >
                        {period === 'weekly' ? 'Hàng tuần' : period === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
                      </button>
                    ))}
                  </div>
                  <div className="hidden sm:flex -space-x-1.5 overflow-hidden">
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-red-500/10 flex items-center justify-center text-[10px] font-black text-red-500">A</div>
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-amber-500/10 flex items-center justify-center text-[10px] font-bold text-amber-600">B</div>
                  </div>
                </div>
              </div>

              {/* MTD & YTD Blocks */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* MTD block */}
                <div className="bg-[#ff9f43] rounded-2xl flex border border-border/40 overflow-hidden shadow-xs">
                  <div className="pl-4 pr-3.5 flex items-center justify-center relative shrink-0">
                    <p className="text-sm font-bold text-white tracking-widest uppercase [writing-mode:vertical-lr] rotate-180 select-none">MTD</p>
                    {/* Arrow Icon triangle */}
                    <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-[#ff9f43] z-10" />
                  </div>
                  <div className="bg-card w-full p-4 flex-1 flex justify-between items-center rounded-r-2xl border-l border-border/40">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground mb-1">Doanh số Tháng này (MTD)</p>
                      <h3 className="text-xl font-extrabold text-foreground tracking-tight tabular-nums mb-2">
                        {monthStats.isLoading ? '...' : fmMoney(monthStats.data?.tong_tien ?? 0)}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                        <span className="badge badge-pill rounded-full bg-green-500/10 text-green-600 h-4 px-1.5 font-bold text-[9px]">+2.5%</span>
                        <span>Tính từ đầu tháng</span>
                      </div>
                    </div>
                    {/* Visual Bar Columns */}
                    <div className="flex items-end gap-1 h-12 w-16 opacity-75">
                      <div className="bg-primary/20 h-4 w-2 rounded-t" />
                      <div className="bg-primary/20 h-6 w-2 rounded-t" />
                      <div className="bg-primary/20 h-10 w-2 rounded-t" />
                      <div className="bg-primary/20 h-5 w-2 rounded-t" />
                      <div className="bg-primary/30 h-12 w-2 rounded-t" />
                    </div>
                  </div>
                </div>

                {/* YTD block */}
                <div className="bg-[#E41F07] rounded-2xl flex border border-border/40 overflow-hidden shadow-xs">
                  <div className="pl-4 pr-3.5 flex items-center justify-center relative shrink-0">
                    <p className="text-sm font-bold text-white tracking-widest uppercase [writing-mode:vertical-lr] rotate-180 select-none">YTD</p>
                    {/* Arrow Icon triangle */}
                    <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-[#E41F07] z-10" />
                  </div>
                  <div className="bg-card w-full p-4 flex-1 flex justify-between items-center rounded-r-2xl border-l border-border/40">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground mb-1">Doanh số Năm nay (YTD)</p>
                      <h3 className="text-xl font-extrabold text-foreground tracking-tight tabular-nums mb-2">
                        {yearStats.isLoading ? '...' : fmMoney(yearStats.data?.tong_tien ?? 0)}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                        <span className="badge badge-pill rounded-full bg-red-500/10 text-red-600 h-4 px-1.5 font-bold text-[9px]">-5.0%</span>
                        <span>Tính từ đầu năm</span>
                      </div>
                    </div>
                    {/* Visual Bar Columns */}
                    <div className="flex items-end gap-1 h-12 w-16 opacity-75">
                      <div className="bg-primary/20 h-5 w-2 rounded-t" />
                      <div className="bg-primary/20 h-8 w-2 rounded-t" />
                      <div className="bg-primary/20 h-4 w-2 rounded-t" />
                      <div className="bg-primary/20 h-9 w-2 rounded-t" />
                      <div className="bg-primary/30 h-11 w-2 rounded-t" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Embedded Trend Chart */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-foreground/80 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Xu hướng số lượng báo giá phát sinh (Quý)
                </div>
                {quarterQuotes.isLoading ? (
                  <Skeleton className="h-[180px] rounded-xl" />
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/10 p-2.5">
                    <svg viewBox={`0 0 ${width} ${height}`} className="h-[180px] w-full">
                      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                        const y = pad.top + innerH * tick
                        return (
                          <g key={tick}>
                            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="rgba(228,31,7,0.06)" strokeWidth="1.5" />
                            <text x={pad.left - 10} y={y + 4} textAnchor="end" fontSize="9" fontWeight="700" fill="#a8a4b3">
                              {tick === 0 ? fmCompact(maxCount) : tick === 1 ? '0' : ''}
                            </text>
                          </g>
                        )
                      })}
                      {trend.map((point, index) => {
                        const x = pad.left + step * index + step / 2
                        return (
                          <g key={point.range}>
                            <text x={x} y={height - 10} textAnchor="middle" fontSize="9" fontWeight="700" fill="#8f8a9d">
                              {index % 2 === 0 || trend.length <= 8 ? point.label : ''}
                            </text>
                          </g>
                        )
                      })}
                      {linePath && (
                        <>
                          <path d={linePath} fill="none" stroke="#E41F07" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          {linePoints.map((point, index) => (
                            <circle key={trend[index].range} cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#E41F07" strokeWidth="2.5" />
                          ))}
                        </>
                      )}
                    </svg>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate Gauge speed-o-meter */}
          <Card className="border-border/60 bg-card shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground">
                Tỷ lệ chốt đơn
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Hiệu quả chốt báo giá thành công</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center gap-4">
              {quarterStats.isLoading ? (
                <Skeleton className="h-[140px] w-full rounded-lg" />
              ) : (
                <div className="w-full flex flex-col items-center">
                  <SpeedometerGauge value={closeRate} />
                  
                  <div className="flex items-center gap-1.5 text-xs mt-3">
                    <span className="font-extrabold text-foreground text-sm">{closeRate}%</span>
                    <span className="badge rounded-full bg-green-500/10 text-green-600 font-bold px-1.5 py-0.5 text-[9px]">+2.5%</span>
                    <span className="text-muted-foreground text-[10px]">Tuần trước</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── ROW 2: Deals Won vs Lost & Pipeline Overview ── */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Deals Won Vs Lost concentric rings */}
          <Card className="border-border/60 bg-card shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h5 className="text-sm font-bold text-foreground uppercase tracking-wider">Báo giá Thành công vs Thất bại</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">+15% so với tháng trước</p>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => quarterQuotes.refetch()}>
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_140px] items-center">
                {/* Metric blocks */}
                <div className="space-y-3">
                  {/* Deals Won */}
                  <div className="border border-border/85 rounded-xl p-3.5 bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#ffe8d6] flex items-center justify-center text-[#ff9f43]">
                        <Tag className="h-4 w-4 fill-current" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Báo giá Đã chốt (Won)</p>
                        <h3 className="text-xl font-extrabold text-foreground tabular-nums tracking-tight">
                          {activeStats?.da_chot ?? 0}
                        </h3>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-0 bg-green-500/10 text-green-600 font-bold text-[9px] px-1.5 py-0.5">
                      +2.5% Tuần trước
                    </Badge>
                  </div>

                  {/* Deals Lost */}
                  <div className="border border-border/85 rounded-xl p-3.5 bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                        <Tag className="h-4 w-4 fill-none" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Báo giá Thất bại (Lost)</p>
                        <h3 className="text-xl font-extrabold text-foreground tabular-nums tracking-tight">
                          {activeStats?.thua ?? 0}
                        </h3>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-0 bg-red-500/10 text-red-600 font-bold text-[9px] px-1.5 py-0.5">
                      -5.0% Tuần trước
                    </Badge>
                  </div>
                </div>

                {/* Nested ring chart graphic */}
                <div className="flex justify-center items-center">
                  {activeStats ? (
                    <ConcentricRings
                      wonPercent={activeStats.tong_bg ? (activeStats.da_chot / activeStats.tong_bg) * 100 : 0}
                      lostPercent={activeStats.tong_bg ? (activeStats.thua / activeStats.tong_bg) * 100 : 0}
                    />
                  ) : (
                    <Skeleton className="h-[120px] w-[120px] rounded-full" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Pipeline Overview Progress Bars */}
          <Card className="border-border/60 bg-card shadow-xs">
            <CardContent className="p-5">
              <div className="mb-4">
                <h5 className="text-sm font-bold text-foreground uppercase tracking-wider">Tổng quan Phễu báo giá</h5>
              </div>
              
              <div className="flex items-center gap-1.5 flex-wrap mb-4">
                <h3 className="text-xl font-extrabold text-foreground tabular-nums tracking-tight">
                  {activeStats?.tong_bg ? fmMoney(activeStats.tong_tien) : '0đ'}
                </h3>
                <Badge variant="outline" className="border-0 bg-green-500/10 text-green-600 font-bold text-[9px] px-1.5 py-0.5">
                  +2.5% Tuần trước
                </Badge>
              </div>

              <div className="space-y-2.5">
                {/* Probability (Purple) */}
                <div className="relative h-8 rounded-lg overflow-hidden flex items-center bg-muted/40">
                  <div
                    className="h-full bg-[#eae7f8] absolute left-0 top-0 transition-all duration-500"
                    style={{ width: '60%' }}
                  />
                  <span className="relative z-10 pl-4 text-xs font-bold text-[#7367f0] select-none">
                    Báo giá Nháp - {fmMoney((activeStats?.tong_tien ?? 0) * 0.3)}
                  </span>
                </div>

                {/* Proposal Sent (Green) */}
                <div className="relative h-8 rounded-lg overflow-hidden flex items-center bg-muted/40">
                  <div
                    className="h-full bg-[#e2f6ed] absolute left-0 top-0 transition-all duration-500"
                    style={{ width: '75%' }}
                  />
                  <span className="relative z-10 pl-4 text-xs font-bold text-[#28c76f] select-none">
                    Đã gửi báo giá - {fmMoney((activeStats?.tong_tien ?? 0) * 0.45)}
                  </span>
                </div>

                {/* Opportunity (Yellow) */}
                <div className="relative h-8 rounded-lg overflow-hidden flex items-center bg-muted/40">
                  <div
                    className="h-full bg-[#fef8e8] absolute left-0 top-0 transition-all duration-500"
                    style={{ width: '40%' }}
                  />
                  <span className="relative z-10 pl-4 text-xs font-bold text-[#ff9f43] select-none">
                    Đang thương thảo - {fmMoney((activeStats?.tong_tien ?? 0) * 0.25)}
                  </span>
                </div>

                {/* Total Deals (Red/Pink) */}
                <div className="relative h-8 rounded-lg overflow-hidden flex items-center bg-muted/40">
                  <div
                    className="h-full bg-[#fdecee] absolute left-0 top-0 transition-all duration-500"
                    style={{ width: '60%' }}
                  />
                  <span className="relative z-10 pl-4 text-xs font-bold text-[#ff4c51] select-none">
                    Tổng báo giá phát sinh - {fmMoney(activeStats?.tong_tien ?? 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── ROW 3: Recent Deals & Average Deal Size ── */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Recently Created Deals table */}
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
                Báo giá mới được lập gần đây
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 font-bold shadow-xs">
                    {recentPeriod === 'Weekly' ? 'Hàng tuần' : recentPeriod === 'Monthly' ? 'Hàng tháng' : 'Hàng năm'}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setRecentPeriod('Weekly')}>Hàng tuần</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRecentPeriod('Monthly')}>Hàng tháng</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRecentPeriod('Yearly')}>Hàng năm</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="p-0">
              {quarterQuotes.isLoading ? (
                <div className="p-5 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : recentQuotes.length ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-[450px]">
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="h-9 px-3.5 text-[10px] font-bold uppercase tracking-wider">Báo giá</TableHead>
                        <TableHead className="h-9 px-3.5 text-right text-[10px] font-bold uppercase tracking-wider">Giá trị</TableHead>
                        <TableHead className="h-9 px-3.5 text-center text-[10px] font-bold uppercase tracking-wider">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentQuotes.slice(0, 5).map((quote) => (
                        <TableRow key={quote.id} className="hover:bg-muted/30 border-b border-border/40">
                          <TableCell className="px-3.5 py-2.5 font-mono text-xs font-bold text-primary">
                            {quote.quote_number}
                          </TableCell>
                          <TableCell className="px-3.5 py-2.5 text-right text-xs font-bold tabular-nums text-foreground">
                            {fmMoney(quote.tong_cong)}
                          </TableCell>
                          <TableCell className="px-3.5 py-2.5 text-center">
                            <StatusBadge status={quote.status} label={quote.status_display} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground">Chưa có báo giá trong quý này.</div>
              )}
            </CardContent>
          </Card>

          {/* Average Deal Size */}
          <Card className="border-border/60 bg-card shadow-xs flex flex-col justify-between overflow-hidden relative min-h-[220px]">
            <CardContent className="p-5 pb-16 flex-1 flex flex-col justify-between">
              <div>
                <div className="mb-2">
                  <h5 className="text-sm font-bold text-foreground uppercase tracking-wider">Giá trị Báo giá Trung bình</h5>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  <h3 className="text-2xl font-extrabold text-foreground tabular-nums tracking-tight">
                    {activeStats?.tong_bg ? fmMoney(activeStats.tong_tien / activeStats.tong_bg) : '0đ'}
                  </h3>
                  <Badge variant="outline" className="border-0 bg-green-500/10 text-green-600 font-bold text-[9px] px-1.5 py-0.5">
                    +2.5% Tuần trước
                  </Badge>
                </div>
              </div>

              {/* Smooth Area Sparkline with exact SVG coordinates */}
              <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
                {recentQuotes.length > 0 && (
                  <svg className="w-full h-full text-primary" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(228, 31, 7, 0.2)" />
                        <stop offset="100%" stopColor="rgba(228, 31, 7, 0)" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M -5,50 ${recentQuotes.slice(0, 10).reverse().map((q, idx) => {
                        const maxVal = activeStats?.tong_tien || 1
                        const h = 50 - (q.tong_cong / maxVal) * 150 - 5
                        const x = (idx / 9) * 110
                        return `L ${x},${Math.max(5, Math.min(45, h))}`
                      }).join(' ')} L 105,50 Z`}
                      fill="url(#sparklineGrad)"
                    />
                    <path
                      d={`${recentQuotes.slice(0, 10).reverse().map((q, idx) => {
                        const maxVal = activeStats?.tong_tien || 1
                        const h = 50 - (q.tong_cong / maxVal) * 150 - 5
                        const x = (idx / 9) * 110
                        return `${idx === 0 ? 'M' : 'L'} ${x},${Math.max(5, Math.min(45, h))}`
                      }).join(' ')}`}
                      fill="none"
                      stroke="#E41F07"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── ROW 4: Multi-period summaries ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { key: 'month', query: monthStats, icon: <CalendarDays className="h-4 w-4" /> },
            { key: 'quarter', query: quarterStats, icon: <BarChart3 className="h-4 w-4" /> },
            { key: 'year', query: yearStats, icon: <TrendingUp className="h-4 w-4" /> },
          ].map((item) => {
            const range = ranges[item.key as keyof typeof ranges]
            const data = item.query.data
            return (
              <Card key={item.key} className="border-border/60 bg-card shadow-xs hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                    {item.icon}
                    {range.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {item.query.isLoading ? (
                    <Skeleton className="h-20 rounded-lg" />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Báo giá phát sinh</span>
                        <span className="font-bold">{data?.tong_bg ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Đã chốt thành công</span>
                        <span className="font-bold text-[#28c76f]">{data?.da_chot ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Thất bại (Lost)</span>
                        <span className="font-bold text-[#ff4c51]">{data?.thua ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-2">
                        <span className="text-muted-foreground font-semibold">Doanh số thu về</span>
                        <span className="font-bold text-primary">{fmMoney(data?.tong_tien ?? 0)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

      </div>
    </div>
  )
}
