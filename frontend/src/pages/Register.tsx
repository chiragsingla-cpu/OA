import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { homePathFor, useAuth } from '../auth/AuthContext'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import { TextField as Field } from '../components/ui/form'
import AuthCard from './AuthCard'

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
    <AuthCard
      title="Create your account"
      subtitle="New accounts start with the employee role."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-[18px]">
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
        {error && <Alert>{error}</Alert>}
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  )
}
