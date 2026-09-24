import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '../../api/client'
import type { Role, User } from '../../api/types'

const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500'

/**
 * Create a user, or edit one (pass `user`). When editing, a blank password keeps the current one.
 */
export default function UserForm({
  user,
  isSelf,
  onSaved,
  onCancel,
}: {
  user?: User
  isSelf: boolean
  onSaved: (user: User) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [role, setRole] = useState<Role>(user?.role ?? 'employee')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = { name, email, role, password }
      const { data } = user
        ? await api.put<{ user: User }>(`/admin/users/${user.id}`, payload)
        : await api.post<{ user: User }>('/admin/users', payload)
      onSaved(data.user)
    } catch (err) {
      setError(errorMessage(err, 'Could not save the user.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold">{user ? `Edit ${user.name}` : 'Add a user'}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Full name</span>
          <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Role</span>
          <select
            value={role}
            disabled={isSelf}
            title={isSelf ? 'You cannot change your own role' : undefined}
            onChange={(e) => setRole(e.target.value as Role)}
            className={`${input} disabled:bg-slate-50`}
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{user ? 'New password' : 'Password'}</span>
          <input
            type="password"
            required={!user}
            minLength={8}
            autoComplete="new-password"
            value={password}
            placeholder={user ? 'Leave blank to keep the current password' : 'At least 8 characters'}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
          />
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  )
}
