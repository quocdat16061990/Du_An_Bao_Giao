import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

const SearchPage = lazy(() => import('@/pages/search'))
const ProductDetailPage = lazy(() => import('@/pages/product-detail'))
const QuotationDashboardPage = lazy(() => import('@/pages/quotation-dashboard'))
const QuotationHistoryPage = lazy(() => import('@/pages/quotation-history'))
const LoginPage = lazy(() => import('@/pages/login'))

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Đang tải...
    </div>
  )
}

function withSuspense(page: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{page}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
  },
  {
    path: '/',
    element: withSuspense(<SearchPage />),
  },
  {
    path: '/search',
    element: withSuspense(<SearchPage />),
  },
  {
    path: '/products/:id',
    element: withSuspense(<ProductDetailPage />),
  },
  {
    path: '/bao-gia',
    element: withSuspense(<QuotationHistoryPage />),
  },
  {
    path: '/bao-gia/dashboard',
    element: withSuspense(<QuotationDashboardPage />),
  },
  {
    path: '/bao-gia-hom-nay',
    element: withSuspense(<QuotationHistoryPage />),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
