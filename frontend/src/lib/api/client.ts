import axios from 'axios'
import { API_BASE_URL } from '@/services/config'

/** Axios instance cho Django backend */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Response interceptor – unwrap data
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message =
        error.response.data?.message ??
        error.response.data?.detail ??
        'Có lỗi xảy ra từ máy chủ'
      console.error(`API Error [${error.response.status}]:`, message)
    } else if (error.request) {
      console.error('API Error: Không thể kết nối đến máy chủ')
    }
    return Promise.reject(error)
  },
)
