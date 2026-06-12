import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

interface SearchSkeletonProps {
  viewMode: 'grid' | 'table'
}

export function SearchSkeleton({ viewMode }: SearchSkeletonProps) {
  if (viewMode === 'table') {
    return (
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4 pt-5">
            {/* Color strip */}
            <Skeleton className="h-1 w-full -mx-4 -mt-5 mb-4" />

            {/* Mã VT + Badge */}
            <div className="flex items-start justify-between mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>

            {/* Title */}
            <Skeleton className="h-5 w-full mb-1" />
            <Skeleton className="h-5 w-3/4 mb-3" />

            {/* Info rows */}
            <div className="space-y-2 mb-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>

            {/* Price */}
            <div className="flex items-end justify-between pt-2 border-t">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
