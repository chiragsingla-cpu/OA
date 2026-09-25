import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import type { DocumentItem } from '../../api/types'
import DocumentReader from '../onboarding/DocumentReader'
import Alert from '../ui/Alert'
import Modal from '../ui/Modal'
import PageHeader from '../ui/PageHeader'
import { panel, table, tableWrap, th } from '../ui/styles'
import { useConfirm } from '../ui/useConfirm'
import DocumentForm from './DocumentForm'
import DocumentRow, { type DocumentAction } from './DocumentRow'
import DocumentsToolbar, { type DocumentFilters } from './DocumentsToolbar'

export default function DocumentsTab() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [filters, setFilters] = useState<DocumentFilters>({ query: '', category: 'all', status: 'all' })
  const [editing, setEditing] = useState<DocumentItem | 'new' | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<DocumentItem | null>(null)
  const { confirm, confirmModal } = useConfirm()

  function load() {
    api
      .get<{ documents: DocumentItem[] }>('/documents')
      .then(({ data }) => setDocuments(data.documents))
      .catch((err) => setError(errorMessage(err)))
  }

  useEffect(load, [])

  async function act(action: DocumentAction, document: DocumentItem) {
    if (action === 'view') return setViewing(document)
    if (action === 'edit') return setEditing(document)
    if (
      action === 'delete' &&
      !(await confirm({
        title: 'Delete document?',
        message: (
          <>
            <strong>{document.title}</strong> will be deleted and removed from Annie's knowledge. This cannot be undone.
          </>
        ),
        confirmLabel: 'Delete',
        danger: true,
      }))
    ) {
      return
    }
    setBusyId(document.id)
    setError(null)
    try {
      if (action === 'delete') await api.delete(`/documents/${document.id}`)
      else await api.post(`/documents/${document.id}/reindex`)
      load()
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

  const query = filters.query.trim().toLowerCase()
  const shown = documents.filter(
    (doc) =>
      (filters.category === 'all' || doc.category === filters.category) &&
      (filters.status === 'all' || doc.status === filters.status) &&
      (!query || `${doc.title} ${doc.original_filename ?? ''}`.toLowerCase().includes(query)),
  )
  const count = (test: (doc: DocumentItem) => boolean) => documents.filter(test).length
  const stats = [
    { label: 'Visible to employees', value: count((doc) => doc.allowed_roles.includes('employee')) },
    { label: 'Admin only', value: count((doc) => !doc.allowed_roles.includes('employee')) },
    { label: 'Failed to index', value: count((doc) => doc.status === 'failed') },
  ]

  return (
    <div>
      <PageHeader
        title="Documents"
        summary={`${documents.length} total · ${count((d) => d.status === 'indexed')} indexed · ${count((d) => d.status === 'pending')} pending`}
      />
      <DocumentsToolbar filters={filters} onChange={setFilters} onAdd={editing ? undefined : () => setEditing('new')} />

      {editing && (
        <div className="mb-4">
          <DocumentForm
            document={editing === 'new' ? undefined : editing}
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
              {['Title', 'File', 'Category', 'Visible to', 'Status'].map((heading) => (
                <th key={heading} className={th}>
                  {heading}
                </th>
              ))}
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((doc) => (
              <DocumentRow key={doc.id} document={doc} busy={busyId === doc.id} onAction={act} />
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="border-b border-line px-4 py-8 text-center text-muted">
                  {documents.length ? (
                    'No documents match these filters.'
                  ) : (
                    <>
                      No documents yet. Add one, or run <code>php artisan app:seed-docs</code>.
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="bg-subtle px-4 py-2.5 text-xs text-muted">
          Showing {shown.length} of {documents.length} documents
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`${panel} px-4 py-3.5`}>
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {viewing && (
        <Modal title="Document preview" size="lg" onClose={() => setViewing(null)}>
          <DocumentReader documentId={viewing.id} />
        </Modal>
      )}
      {confirmModal}
    </div>
  )
}
