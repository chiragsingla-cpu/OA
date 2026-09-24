import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { homePathFor, useAuth } from '../auth/AuthContext'
import AuthCard, { Field } from './AuthCard'

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to={homePathFor(user)} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const signedIn = await login(email, password)
      navigate(homePathFor(signedIn), { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Login failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your company assistant">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  )
}
