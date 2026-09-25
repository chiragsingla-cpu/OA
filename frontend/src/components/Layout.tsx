import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Logo from './ui/Logo'

/**
 * App shell: navy header with the logo, the page's tabs (`nav`) and the signed-in user.
 */
export default function Layout({ nav, children }: { nav?: ReactNode; children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navy text-white">
        <div className="flex flex-wrap items-center gap-x-7 px-4 md:h-[52px] md:flex-nowrap md:px-6">
          <span className="flex h-[52px] items-center gap-2.5 text-[15px] font-semibold">
            <Logo onDark />
            {user?.role === 'admin' ? 'Onboarding Admin' : 'Onboarding Assistant'}
          </span>
          {/* On phones the tabs drop to their own row under the logo. */}
          <div className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto border-t border-white/10 md:border-0 md:order-none md:mx-0 md:w-auto">{nav}</div>
          {user && (
            <div className="ml-auto flex items-center gap-4">
              <span className="hidden text-[13px] text-navy-muted sm:inline">
                {user.name} · <span className="capitalize">{user.role}</span>
              </span>
              <button
                onClick={handleLogout}
                className="rounded border border-white/30 px-3 py-1 text-[13px] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-tab"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="w-full flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  )
}
