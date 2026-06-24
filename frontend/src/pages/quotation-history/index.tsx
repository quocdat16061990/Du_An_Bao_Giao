import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { AppHeader } from '@/components/app-header'
import {
  ArrowLeft, Eye, Edit3, Send, CheckCircle, XCircle,
  Clock, FileText, DollarSign, Users, TrendingUp,
  Loader2, Phone, User, MessageSquare, Calendar,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ═══════════ Types ═══════════
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

// ═══════════ Helpers ═══════════
const fmMoney = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

const fmTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const fmCompact = (n: number): string => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'T'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'Tr'
  return n.toLocaleString('vi-VN')
}

const STATUS_COLOR: Record<string, string> = {
  DA_GUI: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  DA_CHOT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  THUA: 'bg-red-500/10 text-red-400 border-red-500/30',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  DA_GUI: <Send className="h-3.5 w-3.5" />,
  DA_CHOT: <CheckCircle className="h-3.5 w-3.5" />,
  THUA: <XCircle className="h-3.5 w-3.5" />,
}

// ═══════════ Hooks ═══════════
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

// ═══════════ Stats Cards ═══════════
function StatsCards({ stats }: { stats: HistoryStats | undefined }) {
  if (!stats) return null

  const cards = [
    {
      label: 'Tổng báo giá', value: stats.tong_bg,
      icon: <FileText className="h-5 w-5" />,
      bg: 'from-blue-500/10 to-blue-600/5',
      sub: `${stats.da_chot} chốt · ${stats.da_gui} chờ · ${stats.thua} thua`,
    },
    {
      label: 'Khách hàng', value: stats.so_kh,
      icon: <Users className="h-5 w-5" />,
      bg: 'from-violet-500/10 to-purple-600/5',
      sub: 'KH duy nhất',
    },
    {
      label: 'Tổng giá trị', value: fmCompact(stats.tong_tien), isMoney: true,
      icon: <DollarSign className="h-5 w-5" />,
      bg: 'from-emerald-500/10 to-green-600/5',
      sub: stats.tong_tien > 0 ? fmMoney(stats.tong_tien) : '',
    },
    {
      label: 'Tỉ lệ chốt', value: stats.tong_bg > 0 ? `${Math.round((stats.da_chot / stats.tong_bg) * 100)}%` : '0%',
      icon: <TrendingUp className="h-5 w-5" />,
      bg: 'from-amber-500/10 to-orange-600/5',
      sub: `${stats.tong_sp} sản phẩm`,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <div key={i} className={cn('rounded-xl overflow-hidden shadow-lg border border-border/30 flex flex-col', card.bg)}>
          <div className="flex-1 px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {card.label}
              </span>
              <span className="text-muted-foreground/50">{card.icon}</span>
            </div>
            <div className={cn('text-2xl font-extrabold tabular-nums', card.isMoney ? 'text-emerald-400' : 'text-foreground')}>
              {card.value}
            </div>
            {card.sub && (
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════ Detail Dialog ═══════════
function DetailDialog({ entry, open, onClose }: { entry: QuotationEntry | null; open: boolean; onClose: () => void }) {
  if (!entry) return null
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-[640px] max-h-[85vh] flex flex-col bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2 text-foreground">
            {entry.quote_number}
            <Badge className={cn('text-[10px] border', STATUS_COLOR[entry.status])}>
              {STATUS_ICON[entry.status]}
              <span className="ml-1">{entry.status_display}</span>
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Khách hàng:</span><p className="font-semibold">{entry.customer_name}</p></div>
          <div><span className="text-muted-foreground">Điện thoại:</span><p className="font-semibold">{entry.customer_phone || '—'}</p></div>
          <div><span className="text-muted-foreground">Giá áp dụng:</span><Badge variant="outline" className="ml-1">{entry.gia_ap_dung}</Badge></div>
          <div><span className="text-muted-foreground">Nhân viên:</span><p className="font-semibold">{entry.nhan_vien || '—'}</p></div>
        </div>
        {entry.ghi_chu && (
          <div className="bg-muted/30 rounded-lg p-3 text-sm">
            <span className="font-semibold text-xs text-muted-foreground">Ghi chú:</span> {entry.ghi_chu}
          </div>
        )}
        <ScrollArea className="flex-1 max-h-[350px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Mã VT</TableHead>
                <TableHead className="text-xs">Tên hàng</TableHead>
                <TableHead className="text-xs text-right">Đơn giá</TableHead>
                <TableHead className="text-xs text-right">T.Tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs font-mono">{item.ma_vt}</TableCell>
                  <TableCell className="text-xs">{item.ten_hang}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{fmMoney(item.don_gia)}</TableCell>
                  <TableCell className="text-xs text-right font-semibold tabular-nums">{fmMoney(item.thanh_tien)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="text-right font-bold text-base border-t border-border/50 pt-3">
          Tổng cộng: <span className="text-amber-400">{fmMoney(entry.tong_cong)}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════ Edit Dialog ═══════════
function EditDialog({ entry, open, onClose }: { entry: QuotationEntry | null; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState(entry?.status ?? 'DA_GUI')
  const [ghiChu, setGhiChu] = useState(entry?.ghi_chu ?? '')
  const [nhanVien, setNhanVien] = useState(entry?.nhan_vien ?? '')

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch(`/quotations/${entry!.id}/update/`, { status, ghi_chu: ghiChu, nhan_vien: nhanVien })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Đã cập nhật báo giá!')
      onClose()
    },
    onError: () => toast.error('Lỗi cập nhật, thử lại sau'),
  })

  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-[480px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2 text-foreground">
            <Edit3 className="h-4 w-4 text-muted-foreground" />
            Cập nhật {entry.quote_number}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">Trạng thái</Label>
            <div className="flex gap-2 mt-1.5">
              {[
                { key: 'DA_GUI', label: 'Đã gởi', icon: <Send className="h-3.5 w-3.5" />, activeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
                { key: 'DA_CHOT', label: 'Đã chốt', icon: <CheckCircle className="h-3.5 w-3.5" />, activeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
                { key: 'THUA', label: 'Thua', icon: <XCircle className="h-3.5 w-3.5" />, activeClass: 'border-red-500/30 bg-red-500/10 text-red-400' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setStatus(opt.key as QuotationStatus)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-semibold transition-all',
                    status === opt.key
                      ? opt.activeClass + ' ring-1 ring-offset-1 ring-offset-background'
                      : 'border-border/50 bg-card text-muted-foreground hover:bg-muted/30',
                  )}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold">Nhân viên báo giá</Label>
            <Input value={nhanVien} onChange={(e) => setNhanVien(e.target.value)} placeholder="Tên nhân viên..." className="mt-1 h-9" />
          </div>
          <div>
            <Label className="text-xs font-semibold flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Ghi chú</Label>
            <Textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} placeholder="VD: KH hẹn 3 ngày nữa trả lời..." className="mt-1 text-sm" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════ Main Page ═══════════
export default function QuotationHistoryPage() {
  const navigate = useNavigate()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)

  const { data: quotations = [], isLoading, isError } = useQuotationHistory(dateFrom, dateTo)
  const { data: stats, isLoading: statsLoading } = useHistoryStats(dateFrom, dateTo)
  const [detailEntry, setDetailEntry] = useState<QuotationEntry | null>(null)
  const [editEntry, setEditEntry] = useState<QuotationEntry | null>(null)

  const dateDisplay = useMemo(() => {
    if (dateFrom === dateTo) {
      try {
        return format(new Date(dateFrom + 'T00:00:00'), 'EEEE, dd/MM/yyyy', { locale: vi })
      } catch { return dateFrom }
    }
    return `${dateFrom} → ${dateTo}`
  }, [dateFrom, dateTo])

  const headerStats = (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Hôm nay</div>
        <div className="font-bold tabular-nums text-sm text-foreground">{dateDisplay}</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <AppHeader stats={headerStats} />

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* ── Date Range Picker ── */}
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <Calendar className="h-5 w-5 text-amber-400" />
              <Label className="text-sm font-semibold text-foreground whitespace-nowrap">Xem báo giá từ:</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[170px] h-9 text-sm"
              />
              <span className="text-muted-foreground">đến</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[170px] h-9 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => { setDateFrom(today); setDateTo(today) }}
              >
                <Clock className="h-4 w-4" />
                Hôm nay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4" />
                Về trang chính
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Stats Cards ── */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <StatsCards stats={stats} />
        )}

        {/* ── Main Table ── */}
        <Card className="border-border/50 bg-card shadow-none">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-amber-400" />
              Báo giá đã gởi
              {!isLoading && (
                <Badge variant="secondary" className="ml-2 font-bold">{quotations.length}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Đã gởi</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Đã chốt</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Thua</span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : isError ? (
              <div className="text-center py-12 text-red-400">
                <XCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Không thể tải danh sách báo giá</p>
                <p className="text-sm text-muted-foreground mt-1">Vui lòng thử lại sau.</p>
              </div>
            ) : quotations.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="font-semibold text-lg">Chưa có báo giá nào</p>
                <p className="text-sm mt-1">Chọn ngày khác hoặc tạo báo giá mới từ trang chính.</p>
                <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/')}>
                  <ArrowLeft className="h-4 w-4" /> Về trang chính
                </Button>
              </div>
            ) : (
              <ScrollArea className="max-h-[calc(100vh-500px)]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[50px] text-center">#</TableHead>
                      <TableHead className="w-[90px]">Giờ</TableHead>
                      <TableHead className="w-[170px]">Số BG</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead className="w-[100px]">Giá</TableHead>
                      <TableHead className="w-[55px] text-center">SP</TableHead>
                      <TableHead className="w-[160px] text-right">Tổng cộng</TableHead>
                      <TableHead className="w-[110px]">Trạng thái</TableHead>
                      <TableHead className="w-[100px]">Nhân viên</TableHead>
                      <TableHead className="w-[110px] text-center">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((q, idx) => (
                      <TableRow
                        key={q.id}
                        className={cn(
                          'hover:bg-muted/30 transition-colors',
                          q.status === 'DA_CHOT' && 'bg-emerald-500/5',
                          q.status === 'THUA' && 'bg-red-500/5',
                        )}
                      >
                        <TableCell className="text-center text-xs text-muted-foreground font-medium">{idx + 1}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmTime(q.created_at)}</div>
                        </TableCell>
                        <TableCell><span className="font-mono font-semibold text-sm text-amber-400">{q.quote_number}</span></TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{q.customer_name}</span>
                            {q.customer_phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{q.customer_phone}</span>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] border-border/50">{q.gia_ap_dung}</Badge></TableCell>
                        <TableCell className="text-center text-sm font-semibold">{q.product_count}</TableCell>
                        <TableCell className="text-right font-bold text-sm tabular-nums">{fmMoney(q.tong_cong)}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px] border flex items-center gap-1 w-fit', STATUS_COLOR[q.status])}>
                            {STATUS_ICON[q.status]}{q.status_display}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {q.nhan_vien ? <span className="text-sm flex items-center gap-1"><User className="h-3 w-3 text-muted-foreground" />{q.nhan_vien}</span> : <span className="text-xs text-muted-foreground italic">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-500/10" onClick={() => setDetailEntry(q)} title="Xem chi tiết"><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-500/10" onClick={() => setEditEntry(q)} title="Cập nhật"><Edit3 className="h-3.5 w-3.5 text-amber-400" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <DetailDialog entry={detailEntry} open={!!detailEntry} onClose={() => setDetailEntry(null)} />
      <EditDialog entry={editEntry} open={!!editEntry} onClose={() => setEditEntry(null)} />
    </div>
  )
}
