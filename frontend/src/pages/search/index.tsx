import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { SearchBar } from './components/search-bar'
import { FilterSidebar } from './components/filter-sidebar'
import { ProductGrid } from './components/product-grid'
import { PaginationBar } from './components/pagination-bar'
import { ExportBar } from './components/export-bar'
import { EmptyState } from './components/empty-state'
import { SearchSkeleton } from './components/search-skeleton'
import { QuotationDialog } from './components/quotation-dialog'
import { useSearch } from './helper/use-search'
import { useSearchStore } from './store'
import { useDebounce } from '@/hook/use-debounce'
import { SORT_OPTIONS } from './helper/constants'
import { DEFAULT_PAGE_SIZE } from '@/services/config'
import type { SearchParams } from './helper/types'
import { cn } from '@/lib/utils'

export default function SearchPage() {
  // ── Search state ──
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)

  // ── Sort & Pagination ──
  const [sorting, setSorting] = useState('-created_at')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // ── Filter state ──
  const [selectedCategories, setSelectedCategories] = useState<Array<number>>([])
  const [selectedHangMay, setSelectedHangMay] = useState<Array<number>>([])
  const [selectedThuongHieu, setSelectedThuongHieu] = useState<Array<number>>([])
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // ── UI state ──
  const viewMode = 'table' as const

  // ── Store ──
  const selectedIds = useSearchStore((s) => s.selectedProductIds)
  const toggleProduct = useSearchStore((s) => s.toggleProduct)
  const selectAll = useSearchStore((s) => s.selectAll)

  // ── Build search params ──
  const searchParams: SearchParams = useMemo(() => {
    const params: SearchParams = {
      page,
      page_size: pageSize,
      ordering: sorting,
    }
    if (debouncedKeyword.trim()) params.q = debouncedKeyword.trim()
    if (selectedCategories.length === 1) params.category = selectedCategories[0]
    return params
  }, [debouncedKeyword, sorting, page, pageSize, selectedCategories])

  // ⚠️ HangMay + ThuongHieu filters are client-side (filter after fetch)
  // since backend only supports single category filter
  const filterClientSide = useCallback((p: typeof products[0]) => {
    if (selectedHangMay.length > 0 && !selectedHangMay.includes(p.hang_may)) return false
    if (selectedThuongHieu.length > 0 && p.thuong_hieu && !selectedThuongHieu.includes(p.thuong_hieu)) return false
    return true
  }, [selectedHangMay, selectedThuongHieu])

  // ── Query ──
  const { data, isLoading, isFetching, isError } = useSearch(searchParams)

  const rawProducts = data?.results ?? []
  const products = useMemo(() => rawProducts.filter(filterClientSide), [rawProducts, filterClientSide])
  const totalCount = data?.count ?? 0
  const selectedProducts = products.filter((p) => selectedIds.has(p.id))
  const totalPages = data?.total_pages ?? Math.max(1, Math.ceil(totalCount / pageSize))
  const showSkeleton = isLoading && !data

  // ── Actions ──
  const handleClearFilters = useCallback(() => {
    setKeyword('')
    setSelectedCategories([])
    setSelectedHangMay([])
    setSelectedThuongHieu([])
    setSorting('-created_at')
    setPage(1)
  }, [])

  const handleSelectAll = useCallback(() => {
    selectAll(products.map((p) => p.id))
  }, [products, selectAll])

  const hasActiveFilters = selectedCategories.length > 0 || selectedHangMay.length > 0 || selectedThuongHieu.length > 0

  // ── Filter sidebar content ──
  const filterSidebar = (
    <FilterSidebar
      selectedCategories={selectedCategories}
      selectedHangMay={selectedHangMay}
      selectedThuongHieu={selectedThuongHieu}
      onCategoriesChange={(ids) => { setSelectedCategories(ids); setPage(1) }}
      onHangMayChange={setSelectedHangMay}
      onThuongHieuChange={setSelectedThuongHieu}
      onClearAll={handleClearFilters}
      hasActiveFilters={hasActiveFilters}
    />
  )

  // ── Error state ──
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Lỗi kết nối</h2>
          <p className="text-muted-foreground mb-4">
            Không thể kết nối đến máy chủ. Vui lòng thử lại sau.
          </p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="bg-gradient-to-r from-turbo-dark via-slate-800 to-turbo-blue text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-xl font-black tracking-tighter">TD</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight">TURBO DIESEL</h1>
              <p className="text-[10px] text-white/60 leading-tight">
                Chuyên Cung Cấp Turbo & Phụ Tùng Động Cơ
              </p>
            </div>
          </div>

          {/* Search in header */}
          <SearchBar
            value={keyword}
            onChange={(val) => {
              setKeyword(val)
              setPage(1)
            }}
            isLoading={isLoading}
            resultCount={totalCount}
            className="flex-1 max-w-lg"
          />

          {/* Stats (hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-4 text-sm">
            <div className="text-right">
              <div className="text-white/50 text-[10px] uppercase tracking-wider">Tổng SP</div>
              <div className="font-bold tabular-nums">{totalCount.toLocaleString('vi-VN')}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════ MAIN LAYOUT ═══════════ */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4">
        {/* ── Export Bar (top) ── */}
        {products.length > 0 && (
          <div className="mb-4">
            <ExportBar products={products} />
          </div>
        )}

        <div className="flex gap-6">
          {/* ── Desktop Sidebar ── */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-[90px] bg-card rounded-xl border shadow-xs p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              {filterSidebar}
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0">
            {/* Toolbar: mobile filter + sort + select all */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {/* Mobile filter button */}
              <Button
                variant="outline" size="sm" className="lg:hidden h-9 gap-1.5"
                onClick={() => setMobileFilterOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />Bộ lọc
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </Button>

              {/* Result summary */}
              <p className="text-sm text-muted-foreground mr-auto flex items-center gap-2">
                {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                <span>
                  <span className="font-semibold text-foreground">
                    {totalCount.toLocaleString('vi-VN')}
                  </span>{' '}
                  sản phẩm
                </span>
              </p>

              {/* Select all */}
              {products.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={handleSelectAll}>
                  {selectedIds.size >= products.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Button>
              )}

              {/* Sort */}
              <Select value={sorting} onValueChange={(v) => { setSorting(v); setPage(1) }}>
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>

            {/* ── Content ── */}
            {showSkeleton ? (
              <SearchSkeleton viewMode={viewMode} />
            ) : products.length === 0 ? (
              <EmptyState onClearFilters={handleClearFilters} />
            ) : (
              <>
                <div className={cn('transition-opacity duration-200', isFetching && 'opacity-60')}>
                  <ProductGrid
                    products={products}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleProduct}
                    viewMode={viewMode}
                  />
                </div>

                <div className={cn('transition-opacity duration-200', isFetching && 'opacity-60')}>
                  <PaginationBar
                    currentPage={page}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size)
                      setPage(1)
                    }}
                  />
                </div>
              </>
            )}

          </main>
        </div>
      </div>

      {/* ═══════════ MOBILE FILTER SHEET ═══════════ */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Bộ lọc</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6 h-full">{filterSidebar}</div>
        </SheetContent>
      </Sheet>

      {/* ═══════════ QUOTATION DIALOG ═══════════ */}
      <QuotationDialog selectedProducts={selectedProducts} />
    </div>
  )
}
