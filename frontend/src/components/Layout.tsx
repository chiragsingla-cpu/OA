import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              Me
            </span>
            <span className="font-semibold">Onboarding Assistant</span>
          </div>
          {user && (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-slate-600 sm:inline">{user.name}</span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 capitalize">
                {user.role}
              </span>
              <button onClick={handleLogout} className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100">
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
