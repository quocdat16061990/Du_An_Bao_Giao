import { ProductCard } from './product-card'
import type { Product } from '../helper/types'
import { useAuth } from '@/lib/auth/context'

interface ProductGridProps {
  products: Array<Product>
  selectedIds: Set<number>
  onToggleSelect: (product: Product) => void
  viewMode: 'grid' | 'table'
  onEditProduct?: (product: Product) => void
  onDeleteProduct?: (id: number) => void
}

export function ProductGrid({
  products,
  selectedIds,
  onToggleSelect,
  viewMode,
  onEditProduct,
  onDeleteProduct,
}: ProductGridProps) {
  const { user } = useAuth()

  if (viewMode === 'table') {
    return (
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full align-middle caption-bottom text-left text-foreground text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-muted/40 [&>th]:border-b [&>th]:border-border">
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[5.1rem]">
                  <span className="sr-only">Chọn</span>
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[11rem]">
                  Loại
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[13rem]">
                  Mã VT
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border min-w-[18rem]">
                  Tên hàng / Model
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[14rem] hidden xl:table-cell">
                  OEM Part No
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[11rem]">
                  Hãng máy
                </th>
                <th className="relative h-10 text-left align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[10rem]">
                  TH
                </th>
                <th className="relative h-10 text-center align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[14rem]">
                  Đơn vị & Quy cách
                </th>
                <th className="relative h-10 text-center align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[11rem]">
                  Số lượng
                </th>
                <th className="relative h-10 text-right align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[11rem]">
                  Giá vốn
                </th>
                <th className="relative h-10 text-right align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[11rem]">
                  Giá VIP
                </th>
                <th className="relative h-10 text-right align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[11rem]">
                  Giá ưu đãi
                </th>
                <th className="relative h-10 text-right align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[11rem]">
                  Giá đại lý
                </th>
                <th className="relative h-10 text-right align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[11rem]">
                  Giá Gara
                </th>
                <th className={user?.is_staff ? "relative h-10 text-right align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 border-e border-border w-[12rem]" : "relative h-10 text-right align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 w-[12rem]"}>
                  Giá ĐL+10%
                </th>
                {user?.is_staff && (
                  <th className="relative h-10 text-center align-middle font-medium text-secondary-foreground text-[0.8125rem] px-4 w-[11rem]">
                    Thao tác
                  </th>
                )}
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
                  onEditProduct={onEditProduct}
                  onDeleteProduct={onDeleteProduct}
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
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
          />
        </div>
      ))}
    </div>
  )
}
