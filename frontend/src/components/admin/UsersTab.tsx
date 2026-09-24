import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import type { User } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { useConfirm } from '../ui/useConfirm'
import UserForm from './UserForm'

export default function UsersTab() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { confirm, confirmModal } = useConfirm()

  function load() {
    api
      .get<{ users: User[] }>('/admin/users')
      .then(({ data }) => setUsers(data.users))
      .catch((err) => setError(errorMessage(err)))
  }

  useEffect(load, [])

  async function remove(user: User) {
    const confirmed = await confirm({
      title: 'Delete user?',
      message: (
        <>
          <strong>{user.name}</strong> ({user.email}) will be deleted and signed out everywhere. Their past chat questions
          stay in analytics. This cannot be undone.
        </>
      ),
      confirmLabel: 'Delete user',
      danger: true,
    })
    if (!confirmed) return

    setBusyId(user.id)
    setError(null)
    try {
      await api.delete(`/admin/users/${user.id}`)
      setUsers((current) => current.filter((u) => u.id !== user.id))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  function handleSaved() {
    setEditing(null)
    load()
  }

  return (
    <div className="space-y-4">
      {editing ? (
        <UserForm
          user={editing === 'new' ? undefined : editing}
          isSelf={editing !== 'new' && editing.id === me?.id}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button
          onClick={() => setEditing('new')}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add user
        </button>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2 font-medium">
                  {user.name}
                  {user.id === me?.id && <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>}
                </td>
                <td className="px-4 py-2 text-slate-600">{user.email}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      user.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditing(user)}
                    disabled={busyId === user.id}
                    className="ml-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Edit
                  </button>
                  {user.id !== me?.id && (
                    <button
                      onClick={() => remove(user)}
                      disabled={busyId === user.id}
                      className="ml-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirmModal}
    </div>
  )
}
