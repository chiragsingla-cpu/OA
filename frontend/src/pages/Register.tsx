import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { homePathFor, useAuth } from '../auth/AuthContext'
import AuthCard, { Field } from './AuthCard'

export default function Register() {
  const { user, loading, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to={homePathFor(user)} replace />

  const update = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: e.target.value }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const signedIn = await register(form)
      navigate(homePathFor(signedIn), { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Registration failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="New accounts start with the employee role">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" required autoComplete="name" value={form.name} onChange={update('name')} />
        <Field label="Work email" type="email" required autoComplete="email" value={form.email} onChange={update('email')} />
        <Field
          label="Password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
        />
        <Field
          label="Confirm password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password_confirmation}
          onChange={update('password_confirmation')}
        />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
