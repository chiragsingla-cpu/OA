import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import type { User } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import PageHeader from '../ui/PageHeader'
import { table, tableWrap, td, th } from '../ui/styles'
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

  const admins = users.filter((user) => user.role === 'admin').length

  return (
    <div>
      <PageHeader
        title="Users"
        summary={`${users.length} total · ${admins} admin${admins === 1 ? '' : 's'}`}
        actions={
          !editing && (
            <Button onClick={() => setEditing('new')}>
              <Plus size={15} />
              Add user
            </Button>
          )
        }
      />

      {editing && (
        <div className="mb-4">
          <UserForm
            user={editing === 'new' ? undefined : editing}
            isSelf={editing !== 'new' && editing.id === me?.id}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
      {error && <Alert className="mb-4">{error}</Alert>}

      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Email</th>
              <th className={th}>Role</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-subtle">
                <td className={`${td} font-semibold`}>
                  {user.name}
                  {user.id === me?.id && <span className="ml-2 text-xs font-normal text-faint">(you)</span>}
                </td>
                <td className={`${td} text-muted`}>{user.email}</td>
                <td className={`${td} capitalize ${user.role === 'admin' ? 'font-semibold text-brand' : ''}`}>{user.role}</td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <Button variant="link" onClick={() => setEditing(user)} disabled={busyId === user.id}>
                    Edit
                  </Button>
                  {user.id !== me?.id && (
                    <>
                      <span aria-hidden className="text-line">
                        {' | '}
                      </span>
                      <Button variant="danger-link" onClick={() => remove(user)} disabled={busyId === user.id}>
                        Delete
                      </Button>
                    </>
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
