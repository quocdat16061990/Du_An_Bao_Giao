import { useMemo, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationBarProps {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const PAGE_SIZE_OPTIONS = [20, 50, 100]

export function PaginationBar({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  const [jumpInput, setJumpInput] = useState('')

  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, totalCount)

  const pages = useMemo(() => {
    const items: Array<number | 'ellipsis'> = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
    } else {
      items.push(1)
      let start = Math.max(2, currentPage - Math.floor(maxVisible / 2) + 1)
      let end = Math.min(totalPages - 1, start + maxVisible - 4)

      if (end - start < maxVisible - 4) {
        start = Math.max(2, end - (maxVisible - 4))
      }

      if (start > 2) items.push('ellipsis')

      for (let i = start; i <= end; i++) items.push(i)

      if (end < totalPages - 1) items.push('ellipsis')
      items.push(totalPages)
    }

    return items
  }, [currentPage, totalPages])

  const handleJump = useCallback(() => {
    const page = parseInt(jumpInput, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page)
      setJumpInput('')
    }
  }, [jumpInput, totalPages, onPageChange])

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4 px-1">
      {/* ── Left: Record info + page size ── */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="whitespace-nowrap">
          <span className="font-semibold text-foreground tabular-nums">
            {startRecord.toLocaleString('vi-VN')}–{endRecord.toLocaleString('vi-VN')}
          </span>
          {' / '}
          <span className="font-semibold text-foreground tabular-nums">
            {totalCount.toLocaleString('vi-VN')}
          </span>
          {' sản phẩm'}
        </span>

        {/* Page size selector */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-xs">/ trang</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-7 w-[70px] text-xs">
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

      {/* ── Right: Page nav ── */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hidden sm:inline-flex"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          title="Trang đầu"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1 mx-1">
          {pages.map((page, idx) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground text-sm"
              >
                …
              </span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="icon"
                className={cn(
                  'h-8 w-8 text-sm font-medium transition-all',
                  page === currentPage
                    ? 'shadow-md scale-105'
                    : 'hover:bg-muted',
                )}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ),
          )}
        </div>

        {/* Mobile page indicator */}
        <span className="sm:hidden text-sm font-medium px-2 tabular-nums">
          {currentPage} / {totalPages}
        </span>

        {/* Next */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hidden sm:inline-flex"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Trang cuối"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        {/* Jump to page */}
        {totalPages > 20 && (
          <div className="hidden md:flex items-center gap-1 ml-2">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJump()}
              placeholder={`1–${totalPages}`}
              className="h-7 w-[60px] text-xs text-center px-1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={handleJump}
              disabled={!jumpInput}
            >
              Đến
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
