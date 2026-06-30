import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  Tag,
  FileText,
  CheckCircle2,
  XCircle,
  User,
  HelpCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface DashboardData {
  totalSent: number
  successful: number
  rejected: number
  pending: number
  conversionRate: number
  revenue: number
  commission: number
  dateRange: string
  sentTrend: Array<{ label: string; revenue: number; commission: number; count: number }>
  recentQuotes: Array<{
    quote_number: string
    customer_name: string
    tong_cong: number
    status: 'DA_GUI' | 'DA_CHOT' | 'THUA'
    status_display: string
  }>
}

// Simulated data for each period (Day, Week, Month)
const MOCK_DATA: Record<'day' | 'week' | 'month', DashboardData> = {
  day: {
    totalSent: 5,
    successful: 3,
    rejected: 1,
    pending: 1,
    conversionRate: 60,
    revenue: 35000000,
    commission: 3500000,
    dateRange: 'Hôm nay (30/06/2026)',
    sentTrend: [
      { label: '08:00', revenue: 0, commission: 0, count: 0 },
      { label: '10:00', revenue: 7500000, commission: 750000, count: 1 },
      { label: '12:00', revenue: 15000000, commission: 1500000, count: 2 },
      { label: '14:00', revenue: 0, commission: 0, count: 0 },
      { label: '16:00', revenue: 12500000, commission: 1250000, count: 2 },
      { label: '18:00', revenue: 0, commission: 0, count: 0 },
    ],
    recentQuotes: [
      { quote_number: "BG-20260630-001", customer_name: "Anh Khoa (Hải Phòng)", tong_cong: 15000000, status: 'DA_CHOT', status_display: 'Đã chốt' },
      { quote_number: "BG-20260630-002", customer_name: "Mười miền Tây", tong_cong: 12500000, status: 'DA_CHOT', status_display: 'Đã chốt' },
      { quote_number: "BG-20260630-003", customer_name: "Lân Cẩm Phả", tong_cong: 7500000, status: 'DA_CHOT', status_display: 'Đã chốt' },
      { quote_number: "BG-20260630-004", customer_name: "Bảo Lâm Đồng", tong_cong: 3500000, status: 'DA_GUI', status_display: 'Đã gửi' },
      { quote_number: "BG-20260630-005", customer_name: "Tú Vĩnh Long", tong_cong: 2800000, status: 'THUA', status_display: 'Thua' },
    ]
  },
  week: {
    totalSent: 24,
    successful: 16,
    rejected: 4,
    pending: 4,
    conversionRate: 67,
    revenue: 185000000,
    commission: 18500000,
    dateRange: 'Tuần này (24/06 - 30/06/2026)',
    sentTrend: [
      { label: 'Thứ 2', revenue: 35000000, commission: 3500000, count: 4 },
      { label: 'Thứ 3', revenue: 28000000, commission: 2800000, count: 3 },
      { label: 'Thứ 4', revenue: 42000000, commission: 4200000, count: 5 },
      { label: 'Thứ 5', revenue: 15000000, commission: 1500000, count: 2 },
      { label: 'Thứ 6', revenue: 50000000, commission: 5000000, count: 6 },
      { label: 'Thứ 7', revenue: 15000000, commission: 1500000, count: 3 },
      { label: 'Chủ Nhật', revenue: 0, commission: 0, count: 1 },
    ],
    recentQuotes: [
      { quote_number: "BG-20260629-012", customer_name: "Hoàng Phát Đạt", tong_cong: 50000000, status: 'DA_CHOT', status_display: 'Đã chốt' },
      { quote_number: "BG-20260628-009", customer_name: "Thành Đô Group", tong_cong: 42000000, status: 'DA_CHOT', status_display: 'Đã chốt' },
      { quote_number: "BG-20260627-005", customer_name: "Vạn An Bình Định", tong_cong: 35000000, status: 'DA_CHOT', status_display: 'Đã chốt' },
      { quote_number: "BG-20260626-003", customer_name: "Đông Á Auto", tong_cong: 28000000, status: 'DA_CHOT', status_display: 'Đã chốt' },
      { quote_number: "BG-20260625-001", customer_name: "Cơ khí Trường Giang", tong_cong: 15000000, status: 'DA_CHOT', status_display: 'Đã chốt' },
    ]
  },
  month: {
    totalSent: 95,
    successful: 68,
    rejected: 15,
    pending: 12,
    conversionRate: 72,
    revenue: 745000000,
    commission: 74500000,
    dateRange: 'Tháng này (01/06 - 30/06/2026)',
    sentTrend: [
      { label: 'Tuần 1', revenue: 150000000, commission: 15000000, count: 20 },
      { label: 'Tuần 2', revenue: 210000000, commission: 21000000, count: 25 },
      { label: 'Tuần 3', revenue: 245000000, commission: 24500000, count: 32 },
      { label: 'Tuần 4', revenue: 140000000, commission: 14000000, count: 18 },
    ],
    recentQuotes: [
      { quote_number: "BG-20260624-080", customer_name: "Vận tải Hùng Vương", tong_cong: 85000000, status: 'DA_CHOT', status_display: 'Đã chốt' },
      { quote_number: "BG-20260622-075", customer_name: "San lấp Minh Tâm", tong_cong: 76000000, status: 'DA_CHOT', status_display: 'Đã chốt' },
      { quote_number: "BG-20260620-070", customer_name: "Xây dựng Thăng Long", tong_cong: 68000000, status: 'DA_CHOT', status_display: 'Đã chốt' },
      { quote_number: "BG-20260618-062", customer_name: "Garage Auto Phú Cường", tong_cong: 45000000, status: 'DA_CHOT', status_display: 'Đã chốt' },
      { quote_number: "BG-20260615-055", customer_name: "Hợp tác xã Quyết Tiến", tong_cong: 32000000, status: 'DA_CHOT', status_display: 'Đã chốt' },
    ]
  }
}

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

function StatusBadge({ status, label }: { status: DashboardData['recentQuotes'][0]['status']; label: string }) {
  const className = {
    DA_GUI: 'border-[#00bad1]/30 bg-[#00bad1]/10 text-[#00bad1]',
    DA_CHOT: 'border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]',
    THUA: 'border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]',
  }[status]

  return <Badge className={`border text-[10px] font-bold ${className}`}>{label}</Badge>
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

  const needleAngle = -150 + (value / 100) * 120
  const needleRad = (needleAngle * Math.PI) / 180
  const needleLen = 80
  const needleX = center.x + needleLen * Math.cos(needleRad)
  const needleY = center.y + needleLen * Math.sin(needleRad)

  const labelValues = [0, 20, 40, 60, 80, 100]

  return (
    <div className="relative mx-auto h-[200px] w-[300px]">
      <svg viewBox="0 0 300 200" className="h-full w-full">
        {ticks}
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

/* ── Concentric Rings ── */
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
        <circle cx={center} cy={center} r={rWon} fill="none" stroke="#fff5eb" strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={rLost} fill="none" stroke="#ffebeb" strokeWidth={strokeWidth} />

        {/* Won Ring (Green) */}
        <circle
          cx={center}
          cy={center}
          r={rWon}
          fill="none"
          stroke="#28c76f"
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
          stroke="#ff4c51"
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
  
  // State variables for filters
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('month')
  const [selectedAgent, setSelectedAgent] = useState('Luân Miền Nam')

  // Get dynamic mock data based on selection
  const data = useMemo(() => MOCK_DATA[timeRange], [timeRange])

  // Chart calculation logic for double line SVG chart
  const trend = data.sentTrend
  const maxRevenue = useMemo(() => {
    return Math.max(...trend.map((point) => point.revenue), 1)
  }, [trend])

  const chartW = 760
  const chartH = 180
  const pad = { top: 20, right: 30, bottom: 30, left: 60 }
  const innerW = chartW - pad.left - pad.right
  const innerH = chartH - pad.top - pad.bottom
  const step = innerW / Math.max(trend.length - 1, 1)
  const bottomY = pad.top + innerH

  // Coordinates for Revenue curve (Green line)
  const revenuePoints = useMemo(() => {
    return trend.map((point, index) => {
      const x = pad.left + step * index
      const y = bottomY - (point.revenue / maxRevenue) * innerH
      return { x, y }
    })
  }, [trend, step, bottomY, innerH, maxRevenue])
  const revenuePath = useMemo(() => {
    return revenuePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  }, [revenuePoints])

  // Coordinates for Commission/Thực nhận curve (Orange line)
  const commissionPoints = useMemo(() => {
    return trend.map((point, index) => {
      const x = pad.left + step * index
      const y = bottomY - (point.commission / maxRevenue) * innerH
      return { x, y }
    })
  }, [trend, step, bottomY, innerH, maxRevenue])
  const commissionPath = useMemo(() => {
    return commissionPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  }, [commissionPoints])

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Báo cáo hiệu quả kinh doanh
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Thống kê doanh số, số lượng chốt đơn & thực nhận của nhân viên</p>
        </div>
        
        <div className="gap-2 flex items-center flex-wrap">
          {/* Agent Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 font-bold shadow-xs">
                <User className="h-3.5 w-3.5 text-primary" />
                Nhân viên: {selectedAgent}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedAgent('Luân Miền Nam')}>Luân Miền Nam</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedAgent('Anh Khoa')}>Anh Khoa</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedAgent('Minh Tường')}>Minh Tường</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Current date range info */}
          <div className="border border-border px-3 py-1.5 rounded-lg flex items-center bg-card shadow-xs text-xs font-semibold text-foreground">
            <CalendarDays className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="tabular-nums font-mono text-[11px]">{data.dateRange}</span>
          </div>

          <Button variant="outline" size="sm" className="gap-1.5 shadow-xs" onClick={() => navigate('/bao-gia')}>
            Lịch sử báo giá
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] space-y-6">
        
        {/* ── Filter Tab Selector (Hôm nay / Tuần này / Tháng này) ── */}
        <div className="flex justify-between items-center bg-card border border-border/80 p-3 rounded-xl shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Chu kỳ báo cáo:</span>
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 shrink-0 text-xs font-bold">
              {(['day', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  className={`h-7 px-4 rounded-md transition-all ${
                    timeRange === period ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setTimeRange(period)}
                >
                  {period === 'day' ? 'Hôm nay' : period === 'week' ? 'Tuần này' : 'Tháng này'}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/80" />
            Số liệu được tự động cập nhật và làm mới
          </span>
        </div>

        {/* ── ROW 1: 4 Metric Cards (Sent, Conversion, Revenue, Commission) ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: Báo giá đã gửi */}
          <Card className="border-border/60 bg-card shadow-xs hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Báo giá đã gửi
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <FileText className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-foreground tracking-tight tabular-nums">
                {data.totalSent} <span className="text-xs font-medium text-muted-foreground">bản</span>
              </div>
              <p className="text-[10px] text-muted-foreground/80 mt-1 flex items-center gap-1.5">
                <Badge className="border-0 bg-blue-500/10 text-blue-600 font-extrabold text-[9px] px-1 py-0 h-4">
                  SL chờ chốt: {data.pending}
                </Badge>
                <span>Đang chờ phản hồi</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Chốt đơn & Từ chối */}
          <Card className="border-border/60 bg-card shadow-xs hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Chốt đơn / Từ chối
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-foreground tracking-tight tabular-nums flex items-baseline gap-1.5">
                <span className="text-green-600">{data.successful}</span>
                <span className="text-muted-foreground text-xs">/</span>
                <span className="text-red-500 text-lg">{data.rejected}</span>
              </div>
              <p className="text-[10px] text-muted-foreground/80 mt-1">
                Tỷ lệ chốt đơn thành công: <span className="font-bold text-green-600">{data.conversionRate}%</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Doanh số mang lại */}
          <Card className="border-border/60 bg-card shadow-xs hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Doanh số mang lại
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Tag className="h-4.5 w-4.5 fill-current" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-foreground tracking-tight tabular-nums">
                {fmMoney(data.revenue)}
              </div>
              <p className="text-[10px] text-muted-foreground/80 mt-1">
                Doanh thu thực tế chốt thành công
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Thực nhận của bạn */}
          <Card className="border-border/60 bg-primary/5 border-primary/20 shadow-xs hover:bg-primary/10 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">
                Thực nhận của bạn
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-primary tracking-tight tabular-nums">
                {fmMoney(data.commission)}
              </div>
              <p className="text-[10px] text-primary/80 mt-1">
                Mức chiết khấu hoa hồng: <span className="font-bold">10% doanh số</span>
              </p>
            </CardContent>
          </Card>

        </div>

        {/* ── ROW 2: Trend Chart & Tỷ lệ chốt đơn Gauge ── */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
          
          {/* Trend Chart (Revenue & Commission curves) */}
          <Card className="bg-card border-border/60 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="h-4.5 w-4.5 text-primary" />
                    Biểu đồ xu hướng Doanh số & Thực nhận
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground">Theo dõi chênh lệch doanh thu chốt và phần hoa hồng bạn thực nhận</p>
                </div>
                {/* Chart Legend */}
                <div className="flex items-center gap-4 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 rounded-full bg-[#28c76f]" />
                    <span className="text-muted-foreground">Doanh số chốt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 rounded-full bg-[#ff9f43]" />
                    <span className="text-muted-foreground">Thực nhận (10%)</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/10 p-2.5">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-[180px] w-full">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                    const y = pad.top + innerH * tick
                    return (
                      <g key={tick}>
                        <line x1={pad.left} x2={chartW - pad.right} y1={y} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                        <text x={pad.left - 10} y={y + 4} textAnchor="end" fontSize="9" fontWeight="700" fill="#a8a4b3">
                          {tick === 0 ? fmCompact(maxRevenue) : tick === 1 ? '0' : ''}
                        </text>
                      </g>
                    )
                  })}
                  {/* Trend labels */}
                  {trend.map((point, index) => {
                    const x = pad.left + step * index
                    return (
                      <g key={point.label}>
                        <text x={x} y={chartH - 8} textAnchor="middle" fontSize="9" fontWeight="700" fill="#8f8a9d">
                          {point.label}
                        </text>
                      </g>
                    )
                  })}
                  
                  {/* Doanh số Curve (Green) */}
                  {revenuePath && (
                    <>
                      <path d={revenuePath} fill="none" stroke="#28c76f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      {revenuePoints.map((point, index) => (
                        <circle key={`rev-${index}`} cx={point.x} cy={point.y} r="3.5" fill="#fff" stroke="#28c76f" strokeWidth="2.5" />
                      ))}
                    </>
                  )}

                  {/* Thực nhận Curve (Orange) */}
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

          {/* Tỷ lệ chốt đơn Gauge */}
          <Card className="border-border/60 bg-card shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
                Tỷ lệ chốt đơn
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Hiệu quả chốt báo giá thành công trong chu kỳ</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center gap-4">
              <div className="w-full flex flex-col items-center">
                <SpeedometerGauge value={data.conversionRate} />
                <div className="flex items-center gap-1.5 text-xs mt-3">
                  <span className="font-extrabold text-foreground text-sm">{data.conversionRate}%</span>
                  <span className="badge rounded-full bg-green-500/10 text-green-600 font-bold px-1.5 py-0.5 text-[9px]">Ổn định</span>
                  <span className="text-muted-foreground text-[10px]">Tốt hơn bình thường</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ── ROW 3: Báo giá gần đây & Kết quả kinh doanh ── */}
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          
          {/* Recent Quotes Table */}
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                Báo giá phát sinh gần đây
              </CardTitle>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => window.location.reload()}>
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[450px]">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="h-9 px-3.5 text-[10px] font-bold uppercase tracking-wider">Báo giá</TableHead>
                      <TableHead className="h-9 px-3.5 text-[10px] font-bold uppercase tracking-wider">Khách hàng</TableHead>
                      <TableHead className="h-9 px-3.5 text-right text-[10px] font-bold uppercase tracking-wider">Giá trị</TableHead>
                      <TableHead className="h-9 px-3.5 text-center text-[10px] font-bold uppercase tracking-wider">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentQuotes.map((quote) => (
                      <TableRow key={quote.quote_number} className="hover:bg-muted/30 border-b border-border/40">
                        <TableCell className="px-3.5 py-2.5 font-mono text-xs font-bold text-primary">
                          {quote.quote_number}
                        </TableCell>
                        <TableCell className="px-3.5 py-2.5 text-xs text-foreground font-semibold">
                          {quote.customer_name}
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
            </CardContent>
          </Card>

          {/* Won vs Lost Ratios Card */}
          <Card className="border-border/60 bg-card shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                Kết quả chốt báo giá
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Tỷ lệ đơn chốt thành công và bị từ chối</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center gap-4">
              <div className="flex justify-center items-center h-[140px]">
                <ConcentricRings
                  wonPercent={Math.round(data.successful / data.totalSent * 100)}
                  lostPercent={Math.round(data.rejected / data.totalSent * 100)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between border border-border/85 rounded-xl p-2.5 bg-card">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-[#28c76f]" />
                    <span className="text-[11px] font-bold text-foreground">Đã chốt (Won)</span>
                  </div>
                  <span className="text-xs font-bold text-green-600">
                    {data.successful} đơn ({Math.round(data.successful / data.totalSent * 100)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between border border-border/85 rounded-xl p-2.5 bg-card">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-[#ff4c51]" />
                    <span className="text-[11px] font-bold text-foreground">Từ chối (Lost)</span>
                  </div>
                  <span className="text-xs font-bold text-red-500">
                    {data.rejected} đơn ({Math.round(data.rejected / data.totalSent * 100)}%)
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
