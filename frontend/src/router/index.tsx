import { createBrowserRouter } from 'react-router-dom'
import SearchPage from '@/pages/search'
import ProductDetailPage from '@/pages/product-detail'

export const router = createBrowserRouter([
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
])
