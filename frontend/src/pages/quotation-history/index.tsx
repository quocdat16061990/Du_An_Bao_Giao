import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DatesSetArg, EventClickArg, EventContentArg } from '@fullcalendar/core'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle,
  DollarSign,
  Edit3,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import './quotation-calendar.css'

interface QuotationItem {
  id: number
  ma_vt: string
  ten_hang: string
  don_gia: number
  so_luong: number
  thanh_tien: number
}

interface QuotationEntry {
  id: number
  quote_number: string
  quote_date: string
  customer_id: number
  customer_name: string
  customer_phone: string
  gia_ap_dung: string
  tong_cong: number
  product_count: number
  nhan_vien: string
  status: 'DA_GUI' | 'DA_CHOT' | 'THUA'
  status_display: string
  ghi_chu: string
  created_at: string
  updated_at: string
  items: Array<QuotationItem>
}

interface HistoryStats {
  tong_bg: number
  tong_sp: number
  tong_tien: number
  so_kh: number
  da_chot: number
  da_gui: number
  thua: number
}

type QuotationStatus = QuotationEntry['status']
type CalendarViewMode = 'dayGridDay' | 'dayGridWeek' | 'dayGridMonth' | 'dayGridQuarter'

const CALENDAR_VIEW_OPTIONS: Array<{ value: CalendarViewMode; label: string }> = [
  { value: 'dayGridDay', label: 'Ngày' },
  { value: 'dayGridWeek', label: 'Tuần' },
  { value: 'dayGridMonth', label: 'Tháng' },
  { value: 'dayGridQuarter', label: 'Quý' },
]

const STATUS_META: Record<
  QuotationStatus,
  {
    label: string
    badgeClass: string
    eventClass: string
    dotClass: string
    icon: React.ReactNode
  }
> = {
  DA_GUI: {
    label: 'Đã gửi',
    badgeClass: 'border-[#00bad1]/30 bg-[#00bad1]/10 text-[#00bad1]',
    eventClass: 'quote-event-sent',
    dotClass: 'bg-[#00bad1]',
    icon: <Send className="h-3.5 w-3.5" />,
  },
  DA_CHOT: {
    label: 'Đã chốt',
    badgeClass: 'border-[#28c76f]/30 bg-[#28c76f]/10 text-[#28c76f]',
    eventClass: 'quote-event-won',
    dotClass: 'bg-[#28c76f]',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  THUA: {
    label: 'Thua',
    badgeClass: 'border-[#ff4c51]/30 bg-[#ff4c51]/10 text-[#ff4c51]',
    eventClass: 'quote-event-lost',
    dotClass: 'bg-[#ff4c51]',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
}

const fmMoney = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n)

const fmTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const fmCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}T`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}Tr`
  return n.toLocaleString('vi-VN')
}

const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd')

function useQuotationHistory(dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)

  const queryStr = params.toString()
  return useQuery({
    queryKey: ['quotations', 'history', dateFrom, dateTo],
    queryFn: async (): Promise<Array<QuotationEntry>> => {
      const url = queryStr ? `/quotations/history/?${queryStr}` : '/quotations/today/'
      const { data } = await apiClient.get<Array<QuotationEntry>>(url)
      return data
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

function useHistoryStats(dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)

  const queryStr = params.toString()
  return useQuery({
    queryKey: ['quotations', 'history', 'stats', dateFrom, dateTo],
    queryFn: async (): Promise<HistoryStats> => {
      const url = queryStr ? `/quotations/history/stats/?${queryStr}` : '/quotations/today/stats/'
      const { data } = await apiClient.get<HistoryStats>(url)
      return data
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

function StatsCards({ stats }: { stats: HistoryStats | undefined }) {
  if (!stats) return null

  const closeRate = stats.tong_bg > 0 ? Math.round((stats.da_chot / stats.tong_bg) * 100) : 0
  const cards = [
    {
      label: 'Tổng báo giá',
      value: stats.tong_bg,
      icon: <FileText className="h-5 w-5" />,
      sub: `${stats.da_chot} chốt - ${stats.da_gui} đang gửi - ${stats.thua} thua`,
    },
    {
      label: 'Khách hàng',
      value: stats.so_kh,
      icon: <Users className="h-5 w-5" />,
      sub: 'KH duy nhất',
    },
    {
      label: 'Tổng giá trị',
      value: fmCompact(stats.tong_tien),
      icon: <DollarSign className="h-5 w-5" />,
      sub: stats.tong_tien > 0 ? fmMoney(stats.tong_tien) : '0 đ',
      highlight: true,
    },
    {
      label: 'Tỉ lệ chốt',
      value: `${closeRate}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      sub: `${stats.tong_sp} sản phẩm`,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-border/60 bg-card/95 shadow-sm">
          <CardContent className="p-3.5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </span>
              <span className="text-muted-foreground/55">{card.icon}</span>
            </div>
            <div
              className={cn(
                'text-[1.65rem] font-extrabold leading-tight tabular-nums text-foreground',
                card.highlight && 'text-[#28c76f]',
              )}
            >
              {card.value}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DetailDialog({
  entry,
  open,
  onClose,
}: {
  entry: QuotationEntry | null
  open: boolean
  onClose: () => void
}) {
  if (!entry) return null
  const statusMeta = STATUS_META[entry.status]

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="max-h-[85vh] max-w-[720px] border-border/50 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base text-foreground">
            {entry.quote_number}
            <Badge className={cn('border text-[10px]', statusMeta.badgeClass)}>
              {statusMeta.icon}
              <span className="ml-1">{entry.status_display || statusMeta.label}</span>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Khách hàng:</span>
            <p className="font-semibold">{entry.customer_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Điện thoại:</span>
            <p className="font-semibold">{entry.customer_phone || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Giá áp dụng:</span>
            <Badge variant="outline" className="ml-2">{entry.gia_ap_dung}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Nhân viên:</span>
            <p className="font-semibold">{entry.nhan_vien || '-'}</p>
          </div>
        </div>

        {entry.ghi_chu && (
          <div className="rounded-lg bg-muted/35 p-3 text-sm">
            <span className="font-semibold text-muted-foreground">Ghi chú:</span> {entry.ghi_chu}
          </div>
        )}

        <ScrollArea className="max-h-[350px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Mã VT</TableHead>
                <TableHead className="text-xs">Tên hàng</TableHead>
                <TableHead className="text-right text-xs">Đơn giá</TableHead>
                <TableHead className="text-right text-xs">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.ma_vt}</TableCell>
                  <TableCell className="text-xs">{item.ten_hang}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {fmMoney(item.don_gia)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-semibold tabular-nums">
                    {fmMoney(item.thanh_tien)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="border-t border-border/50 pt-3 text-right text-base font-bold">
          Tổng cộng: <span className="text-[#ff9f43]">{fmMoney(entry.tong_cong)}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditDialog({
  entry,
  open,
  onClose,
}: {
  entry: QuotationEntry | null
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<QuotationStatus>('DA_GUI')
  const [ghiChu, setGhiChu] = useState('')
  const [nhanVien, setNhanVien] = useState('')

  useEffect(() => {
    if (!entry) return
    setStatus(entry.status)
    setGhiChu(entry.ghi_chu ?? '')
    setNhanVien(entry.nhan_vien ?? '')
  }, [entry])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch(`/quotations/${entry!.id}/update/`, {
        status,
        ghi_chu: ghiChu,
        nhan_vien: nhanVien,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Đã cập nhật báo giá')
      onClose()
    },
    onError: () => toast.error('Lỗi cập nhật, vui lòng thử lại'),
  })

  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="max-w-[480px] border-border/50 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base text-foreground">
            <Edit3 className="h-4 w-4 text-muted-foreground" />
            Cập nhật {entry.quote_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">Trạng thái</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(Object.keys(STATUS_META) as Array<QuotationStatus>).map((key) => {
                const meta = STATUS_META[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatus(key)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                      status === key
                        ? meta.badgeClass
                        : 'border-border/60 bg-card text-muted-foreground hover:bg-muted/40',
                    )}
                  >
                    {meta.icon}
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Nhân viên báo giá</Label>
            <Input
              value={nhanVien}
              onChange={(e) => setNhanVien(e.target.value)}
              placeholder="Tên nhân viên..."
              className="mt-1 h-9"
            />
          </div>

          <div>
            <Label className="flex items-center gap-1 text-xs font-semibold">
              <MessageSquare className="h-3 w-3" />
              Ghi chú
            </Label>
            <Textarea
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="VD: KH hẹn 3 ngày nữa trả lời..."
              className="mt-1 text-sm"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="bg-[#ff9f43] font-semibold text-black hover:bg-[#fb8c20]"
          >
            {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function QuotationHistoryPage() {
  const navigate = useNavigate()
  const today = toApiDate(new Date())
  const calendarRef = useRef<FullCalendar | null>(null)
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('dayGridWeek')
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [visibleTitle, setVisibleTitle] = useState('')
  const [detailEntry, setDetailEntry] = useState<QuotationEntry | null>(null)
  const [editEntry, setEditEntry] = useState<QuotationEntry | null>(null)

  const { data: quotations = [], isLoading, isError } = useQuotationHistory(dateFrom, dateTo)
  const { data: stats, isLoading: statsLoading } = useHistoryStats(dateFrom, dateTo)

  const calendarEvents = useMemo(() => {
    return quotations.map((quote) => ({
      id: String(quote.id),
      title: quote.quote_number,
      start: quote.created_at || quote.quote_date,
      classNames: [STATUS_META[quote.status].eventClass],
      extendedProps: { quote },
    }))
  }, [quotations])

  const dateDisplay = useMemo(() => {
    if (dateFrom === dateTo) return format(parseISO(dateFrom), 'dd/MM/yyyy')
    return `${format(parseISO(dateFrom), 'dd/MM/yyyy')} - ${format(parseISO(dateTo), 'dd/MM/yyyy')}`
  }, [dateFrom, dateTo])

  const handleDatesSet = (arg: DatesSetArg) => {
    const endInclusive = new Date(arg.end)
    endInclusive.setDate(endInclusive.getDate() - 1)
    setDateFrom(toApiDate(arg.start))
    setDateTo(toApiDate(endInclusive))
    setVisibleTitle(arg.view.title)
  }

  const handleCalendarViewChange = (nextView: CalendarViewMode) => {
    setCalendarView(nextView)
    calendarRef.current?.getApi().changeView(nextView)
  }

  const handleEventClick = (arg: EventClickArg) => {
    const quote = arg.event.extendedProps.quote as QuotationEntry | undefined
    if (quote) setDetailEntry(quote)
  }

  const renderEventContent = (arg: EventContentArg) => {
    const quote = arg.event.extendedProps.quote as QuotationEntry
    const statusMeta = STATUS_META[quote.status]

    return (
      <div className="quote-event-content">
        <div className="quote-event-topline">
          <span className={cn('quote-event-dot', statusMeta.dotClass)} />
          <span className="quote-event-time">{fmTime(quote.created_at)}</span>
          <span className="quote-event-products">{quote.product_count} SP</span>
        </div>
        <div className="quote-event-number">{quote.quote_number}</div>
        <div className="quote-event-customer">{quote.customer_name || 'Khách lẻ'}</div>
      </div>
    )
  }

  const headerStats = (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Lịch báo giá</div>
        <div className="text-sm font-bold tabular-nums text-foreground">{visibleTitle || dateDisplay}</div>
      </div>
    </div>
  )

  return (
    <div className="quotation-page-bg min-h-screen">
      <AppHeader stats={headerStats} />

      <main className="mx-auto max-w-[1500px] space-y-4 px-4 py-4 md:px-5">
        <Card className="border-border/50 bg-card shadow-sm">
          <CardContent className="flex flex-wrap items-center gap-3 p-3.5">
            <CalendarDays className="h-5 w-5 text-[#ff9f43]" />
            <div className="min-w-[190px]">
              <p className="text-sm font-semibold text-foreground">Lịch báo giá</p>
              <p className="text-xs text-muted-foreground">{dateDisplay}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
              Về trang chính
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/bao-gia/dashboard')}>
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
            <div className="flex rounded-lg border border-border/70 bg-muted/30 p-1">
              {CALENDAR_VIEW_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={calendarView === option.value ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => handleCalendarViewChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {(Object.keys(STATUS_META) as Array<QuotationStatus>).map((key) => (
                <span key={key} className="flex items-center gap-1">
                  <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_META[key].dotClass)} />
                  {STATUS_META[key].label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : (
          <StatsCards stats={stats} />
        )}

        <Card className="quotation-calendar-card border-border/50 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 pb-1.5 pt-3">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <FileText className="h-4 w-4 text-[#ff9f43]" />
              Báo giá theo lịch
              {!isLoading && <Badge variant="secondary" className="h-5 px-2 text-[11px] font-bold">{quotations.length}</Badge>}
            </CardTitle>
            {isLoading && (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang tải
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isError ? (
              <div className="px-6 py-16 text-center text-red-500">
                <XCircle className="mx-auto mb-3 h-12 w-12 opacity-30" />
                <p className="font-semibold">Không thể tải danh sách báo giá</p>
                <p className="mt-1 text-sm text-muted-foreground">Vui lòng thử lại sau.</p>
              </div>
            ) : (
              <div className={cn('quotation-calendar-shell', isLoading && 'opacity-60')}>
                <div className="quotation-calendar-scroll">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView={calendarView}
                    initialDate={today}
                    views={{
                      dayGridQuarter: {
                        type: 'dayGridMonth',
                        duration: { months: 3 },
                      },
                    }}
                    events={calendarEvents}
                    datesSet={handleDatesSet}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    height="auto"
                    fixedWeekCount={false}
                    dayMaxEvents={3}
                    moreLinkText={(count) => `+${count} nữa`}
                    locale="vi"
                    firstDay={1}
                    nowIndicator
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: '',
                    }}
                    buttonText={{
                      today: 'Hôm nay',
                    }}
                    dayHeaderFormat={{ weekday: 'short' }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <DetailDialog entry={detailEntry} open={!!detailEntry} onClose={() => setDetailEntry(null)} />
      <EditDialog entry={editEntry} open={!!editEntry} onClose={() => setEditEntry(null)} />
    </div>
  )
}
