import axios from 'axios'

const TOKEN_KEY = 'onboarding_assistant_token'

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage unavailable (private mode). The session just won't survive a reload.
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = readToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Expired or revoked token: drop it and send the user back to login.
    if (axios.isAxiosError(error) && error.response?.status === 401 && readToken()) {
      storeToken(null)
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Cannot reach the server. Is the backend running?'
    const data = error.response.data as { message?: string; errors?: Record<string, string[]> } | undefined
    const firstFieldError = data?.errors ? Object.values(data.errors).flat()[0] : undefined
    return firstFieldError ?? data?.message ?? fallback
  }
  return fallback
}
