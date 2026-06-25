import { API_BASE_URL } from '@/services/config'

const API_VERSION_PATH = /\/api\/v\d+\/?$/

function getBackendOrigin() {
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    return API_BASE_URL.replace(API_VERSION_PATH, '')
  }

  return ''
}

export function getMediaUrl(path?: string | null) {
  if (!path) return ''

  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${getBackendOrigin()}${cleanPath}`
}
