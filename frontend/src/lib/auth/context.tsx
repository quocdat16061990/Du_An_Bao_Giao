import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { apiClient } from '@/lib/api/client'

interface User {
  id: number
  username: string
  email: string
  is_staff: boolean
  display_name: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const TOKEN_KEY = 'turbo_access_token'
const REFRESH_KEY = 'turbo_refresh_token'

function applyAuthToken(nextToken: string | null) {
  if (nextToken) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${nextToken}`
    localStorage.setItem(TOKEN_KEY, nextToken)
  } else {
    delete apiClient.defaults.headers.common['Authorization']
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(true)

  // Set token on axios
  useEffect(() => {
    applyAuthToken(token)
  }, [token])

  // Try to load user on mount if token exists
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    apiClient
      .get('/auth/me/')
      .then(({ data }) => {
        setUser(data)
      })
      .catch(() => {
        // Token expired, try refresh
        const refresh = localStorage.getItem(REFRESH_KEY)
        if (refresh) {
          return apiClient
            .post('/auth/refresh/', { refresh })
            .then(({ data }) => {
              applyAuthToken(data.access)
              setToken(data.access)
              localStorage.setItem(REFRESH_KEY, data.refresh)
              return apiClient.get('/auth/me/')
            })
            .then(({ data }) => {
              setUser(data)
            })
            .catch(() => {
              setToken(null)
              localStorage.removeItem(REFRESH_KEY)
            })
        }
        setToken(null)
        localStorage.removeItem(REFRESH_KEY)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await apiClient.post('/auth/login/', { username, password })
    applyAuthToken(data.access)
    setToken(data.access)
    localStorage.setItem(REFRESH_KEY, data.refresh)

    // Fetch user info
    const { data: userData } = await apiClient.get('/auth/me/')
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }, [])

  const refreshToken = useCallback(async (): Promise<string | null> => {
    const refresh = localStorage.getItem(REFRESH_KEY)
    if (!refresh) return null
    try {
      const { data } = await apiClient.post('/auth/refresh/', { refresh })
      applyAuthToken(data.access)
      setToken(data.access)
      localStorage.setItem(REFRESH_KEY, data.refresh)
      return data.access
    } catch {
      logout()
      return null
    }
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
