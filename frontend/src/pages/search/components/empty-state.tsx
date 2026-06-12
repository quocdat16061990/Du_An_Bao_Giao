import { PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onClearFilters: () => void
}

export function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
        <PackageSearch className="relative h-20 w-20 text-muted-foreground/60" />
      </div>

      <h3 className="text-xl font-bold text-foreground mb-2">
        Không tìm thấy sản phẩm nào
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Thử tìm với từ khóa khác, hoặc xóa bộ lọc để xem tất cả sản phẩm.
      </p>

      <Button variant="outline" onClick={onClearFilters}>
        Xóa bộ lọc
      </Button>
    </div>
  )
}
