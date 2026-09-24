import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, readToken, storeToken } from '../api/client'
import type { User } from '../api/types'

interface AuthResponse {
  user: User
  token: string
}

interface RegisterInput {
  name: string
  email: string
  password: string
  password_confirmation: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function homePathFor(user: User): string {
  return user.role === 'admin' ? '/admin' : '/dashboard'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!readToken()) {
      setLoading(false)
      return
    }
    api
      .get<{ user: User }>('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => storeToken(null))
      .finally(() => setLoading(false))
  }, [])

  const acceptSession = useCallback((data: AuthResponse) => {
    storeToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const login = useCallback(
    async (email: string, password: string) =>
      acceptSession((await api.post<AuthResponse>('/auth/login', { email, password })).data),
    [acceptSession],
  )

  const register = useCallback(
    async (input: RegisterInput) => acceptSession((await api.post<AuthResponse>('/auth/register', input)).data),
    [acceptSession],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      storeToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
