import { ProductCard } from './product-card'
import type { Product } from '../helper/types'

interface ProductGridProps {
  products: Array<Product>
  selectedIds: Set<number>
  onToggleSelect: (product: Product) => void
  viewMode: 'grid' | 'table'
}

export function ProductGrid({ products, selectedIds, onToggleSelect, viewMode }: ProductGridProps) {
  if (viewMode === 'table') {
    return (
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full align-middle caption-bottom text-left text-foreground text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-muted/40 [&>th]:border-b [&>th]:border-border">
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[51px]">
                  <span className="sr-only">Chọn</span>
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[110px]">
                  Loại
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[130px]">
                  Mã VT
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border min-w-[180px]">
                  Tên hàng / Model
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[140px] hidden xl:table-cell">
                  OEM Part No
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[110px]">
                  Hãng máy
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[100px]">
                  TH
                </th>
                <th className="relative h-10 text-center align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[140px]">
                  Đơn vị & Quy cách
                </th>
                <th className="relative h-10 text-right align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 w-[160px]">
                  Giá
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, idx) => (
                <ProductCard
                  key={`${product.loai}-${product.id}`}
                  product={product}
                  isSelected={selectedIds.has(product.id)}
                  onToggleSelect={onToggleSelect}
                  viewMode="table"
                  rowIndex={idx}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
      {products.map((product, index) => (
        <div
          key={`${product.loai}-${product.id}`}
          className="animate-in fade-in slide-in-from-bottom-4 h-full flex flex-col"
          style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'backwards' }}
        >
          <ProductCard
            product={product}
            isSelected={selectedIds.has(product.id)}
            onToggleSelect={onToggleSelect}
            viewMode="grid"
          />
        </div>
      ))}
    </div>
  )
}
