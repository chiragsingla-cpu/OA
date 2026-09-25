import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '../../api/client'
import type { Role, User } from '../../api/types'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import { inputClass } from '../ui/form'
import { panel } from '../ui/styles'

const input = inputClass

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
    <form onSubmit={handleSubmit} className={`${panel} space-y-4 p-5`}>
      <h3 className="text-[15px] font-semibold">{user ? `Edit ${user.name}` : 'Add a user'}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1.5 block text-[13px] font-semibold">Full name</span>
          <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block text-[13px] font-semibold">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block text-[13px] font-semibold">Role</span>
          <select
            value={role}
            disabled={isSelf}
            title={isSelf ? 'You cannot change your own role' : undefined}
            onChange={(e) => setRole(e.target.value as Role)}
            className={input}
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block text-[13px] font-semibold">{user ? 'New password' : 'Password'}</span>
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

      {error && <Alert>{error}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
