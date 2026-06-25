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
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from 'date-fns'

import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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

function useRecent(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['quotations', 'dashboard', 'recent', dateFrom, dateTo],
    queryFn: async (): Promise<Array<QuotationEntry>> => {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
      const { data } = await apiClient.get<Array<QuotationEntry>>(`/quotations/history/?${params}`)
      return data.slice(0, 8)
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
  const recent = useRecent(ranges.quarter.from, ranges.quarter.to)
  const activeStats = quarterStats.data
  const closeRate = activeStats?.tong_bg ? Math.round((activeStats.da_chot / activeStats.tong_bg) * 100) : 0

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
            {recent.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-lg" />)}
              </div>
            ) : recent.data?.length ? (
              <div className="divide-y rounded-lg border">
                {recent.data.map((quote) => (
                  <div key={quote.id} className="grid grid-cols-1 gap-2 p-3 text-sm md:grid-cols-[1fr_1.4fr_auto_auto] md:items-center">
                    <div className="font-mono font-semibold text-[#7367f0]">{quote.quote_number}</div>
                    <div className="font-medium">{quote.customer_name}</div>
                    <div className="text-muted-foreground">{quote.product_count} SP - {fmMoney(quote.tong_cong)}</div>
                    <StatusBadge status={quote.status} label={quote.status_display} />
                  </div>
                ))}
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
