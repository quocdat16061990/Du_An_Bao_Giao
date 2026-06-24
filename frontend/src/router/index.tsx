import { createBrowserRouter } from 'react-router-dom'
import SearchPage from '@/pages/search'
import ProductDetailPage from '@/pages/product-detail'
import QuotationHistoryPage from '@/pages/quotation-history'
import LoginPage from '@/pages/login'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <SearchPage />,
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
  {
    path: '/products/:id',
    element: <ProductDetailPage />,
  },
  {
    path: '/bao-gia',
    element: <QuotationHistoryPage />,
  },
  {
    path: '/bao-gia-hom-nay',
    element: <QuotationHistoryPage />,
  },
])
