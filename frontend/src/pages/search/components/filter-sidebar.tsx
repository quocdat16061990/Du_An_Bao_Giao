import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import { ChevronDown, ChevronRight, Filter, RotateCcw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Category } from '../helper/types'

interface FilterSidebarProps {
  selectedCategories: Array<number>
  selectedHangMay: Array<number>
  selectedThuongHieu: Array<number>
  onCategoriesChange: (ids: Array<number>) => void
  onHangMayChange: (ids: Array<number>) => void
  onThuongHieuChange: (ids: Array<number>) => void
  onClearAll: () => void
  hasActiveFilters: boolean
}

export function FilterSidebar({
  selectedCategories, selectedHangMay, selectedThuongHieu,
  onCategoriesChange, onHangMayChange, onThuongHieuChange,
  onClearAll, hasActiveFilters,
}: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    hangmay: false,
    thuonghieu: false,
  })

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Fetch categories
  const { data: categories = [], isLoading: catLoading } = useQuery<Array<Category>>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/categories/')
      return data.filter((c: Category) => c.product_count > 0)
    },
    staleTime: 300_000,
  })

  // Fetch hãng máy
  const { data: hangMayList = [], isLoading: hmLoading } = useQuery<Array<{ id: number; ten: string }>>({
    queryKey: ['hang-may'],
    queryFn: async () => { const { data } = await apiClient.get('/hang-may/'); return data },
    staleTime: 300_000,
  })

  // Fetch thương hiệu
  const { data: thuongHieuList = [], isLoading: thLoading } = useQuery<Array<{ id: number; ten: string }>>({
    queryKey: ['thuong-hieu'],
    queryFn: async () => { const { data } = await apiClient.get('/thuong-hieu/'); return data },
    staleTime: 300_000,
  })

  const toggleItem = (id: number, selected: Array<number>, onChange: (ids: Array<number>) => void) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Bộ lọc</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={onClearAll}>
            <RotateCcw className="h-3 w-3 mr-1" />Xóa
          </Button>
        )}
      </div>

      <Separator className="mb-3" />

      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4">
          {/* ── Category ── */}
          <FilterSection
            title="Loại sản phẩm"
            count={categories.length}
            isOpen={openSections.category}
            onToggle={() => toggleSection('category')}
            isLoading={catLoading}
          >
            {categories.map((cat) => (
              <FilterItem
                key={cat.id}
                label={cat.ten}
                count={cat.product_count}
                checked={selectedCategories.includes(cat.id)}
                onChange={() => toggleItem(cat.id, selectedCategories, onCategoriesChange)}
              />
            ))}
          </FilterSection>

          {/* ── Hãng máy ── */}
          <FilterSection
            title="Hãng máy"
            count={hangMayList.length}
            isOpen={openSections.hangmay}
            onToggle={() => toggleSection('hangmay')}
            isLoading={hmLoading}
          >
            {hangMayList.slice(0, 50).map((hm) => (
              <FilterItem
                key={hm.id}
                label={hm.ten}
                checked={selectedHangMay.includes(hm.id)}
                onChange={() => toggleItem(hm.id, selectedHangMay, onHangMayChange)}
              />
            ))}
          </FilterSection>

          {/* ── Thương hiệu ── */}
          <FilterSection
            title="Thương hiệu"
            count={thuongHieuList.length}
            isOpen={openSections.thuonghieu}
            onToggle={() => toggleSection('thuonghieu')}
            isLoading={thLoading}
          >
            {thuongHieuList.slice(0, 50).map((th) => (
              <FilterItem
                key={th.id}
                label={th.ten}
                checked={selectedThuongHieu.includes(th.id)}
                onChange={() => toggleItem(th.id, selectedThuongHieu, onThuongHieuChange)}
              />
            ))}
          </FilterSection>
        </div>
      </ScrollArea>
    </div>
  )
}

// ── Sub components ──

function FilterSection({
  title, count, isOpen, onToggle, isLoading, children,
}: {
  title: string; count: number; isOpen: boolean; onToggle: () => void
  isLoading: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left py-1.5 text-foreground hover:text-primary transition-colors"
      >
        <div className="flex items-center gap-1.5">
          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{count}</Badge>
        </div>
      </button>
      {isOpen && <div className="ml-5 mt-1 space-y-0.5">{children}</div>}
    </div>
  )
}

function FilterItem({
  label, count, checked, onChange,
}: {
  label: string; count?: number; checked: boolean; onChange: () => void
}) {
  return (
    <label className={cn(
      'flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors',
      'hover:bg-accent/70',
      checked && 'bg-primary/10 text-primary',
    )}>
      <Checkbox checked={checked} onCheckedChange={onChange} className="h-3.5 w-3.5" />
      <span className="text-xs text-foreground truncate flex-1">{label}</span>
      {count !== undefined && <span className="text-[10px] text-muted-foreground">{count}</span>}
    </label>
  )
}
