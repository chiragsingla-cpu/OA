import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { CATEGORY_LABELS, type DocumentItem, type DocumentStatus } from '../../api/types'
import DocumentReader from '../onboarding/DocumentReader'
import Modal from '../ui/Modal'
import { useConfirm } from '../ui/useConfirm'
import DocumentForm from './DocumentForm'

const STATUS_STYLES: Record<DocumentStatus, string> = {
  indexed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
}

export default function DocumentsTab() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
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

  async function act(document: DocumentItem, action: 'reindex' | 'delete') {
    if (
      action === 'delete' &&
      !(await confirm({
        title: 'Delete document?',
        message: (
          <>
            <strong>{document.title}</strong> will be deleted and removed from the assistant. This cannot be undone.
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

  return (
    <div className="space-y-4">
      {editing ? (
        <DocumentForm
          document={editing === 'new' ? undefined : editing}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button
          onClick={() => setEditing('new')}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add document
        </button>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Visible to</th>
              <th className="px-4 py-2">Index status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="px-4 py-2 font-medium">
                  {doc.title}
                  {doc.original_filename && <div className="text-xs font-normal text-slate-400">{doc.original_filename}</div>}
                </td>
                <td className="px-4 py-2 text-slate-600">{CATEGORY_LABELS[doc.category]}</td>
                <td className="px-4 py-2 text-slate-600 capitalize">{doc.allowed_roles.join(', ')}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status]}`} title={doc.error ?? ''}>
                    {doc.status}
                    {doc.status === 'indexed' && doc.chunk_count ? ` · ${doc.chunk_count} chunks` : ''}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <RowButton label="View" onClick={() => setViewing(doc)} disabled={busyId === doc.id} />
                  <RowButton label="Edit" onClick={() => setEditing(doc)} disabled={busyId === doc.id} />
                  <RowButton label="Reindex" onClick={() => act(doc, 'reindex')} disabled={busyId === doc.id} />
                  <RowButton label="Delete" onClick={() => act(doc, 'delete')} disabled={busyId === doc.id} danger />
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No documents yet. Add one, or run <code>php artisan app:seed-docs</code>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

function RowButton({ label, onClick, disabled, danger }: { label: string; onClick: () => void; disabled: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`ml-1 rounded-md px-2 py-1 text-xs disabled:opacity-40 ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  )
}
