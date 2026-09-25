import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { Role } from '../api/types'
import { homePathFor, useAuth } from './AuthContext'

/**
 * Hides a page from signed-out users and from other roles. This only controls what the UI shows.
 * The Laravel API enforces the real access rules.
 */
export default function ProtectedRoute({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-muted">Loading…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />

  return <>{children}</>
}
