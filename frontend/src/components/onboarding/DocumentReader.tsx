import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { CATEGORY_LABELS, type DocumentItem } from '../../api/types'
import Markdown from '../Markdown'
import Checklist from './Checklist'

/**
 * Shows a document. Without `onAsk` it is a read-only preview (used by admins): no "Ask" button,
 * and checklists are shown as plain content instead of recording progress.
 */
export default function DocumentReader({
  documentId,
  onAsk,
}: {
  documentId: string
  onAsk?: (document: DocumentItem) => void
}) {
  const [document, setDocument] = useState<DocumentItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setDocument(null)
    setError(null)
    api
      .get<{ document: DocumentItem }>(`/documents/${documentId}`)
      .then(({ data }) => !cancelled && setDocument(data.document))
      .catch((err) => !cancelled && setError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [documentId])

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  if (!document) return <p className="text-sm text-slate-500">Loading…</p>

  const body = document.body_text ?? ''
  const preview = !onAsk

  return (
    <article className={preview ? '' : 'rounded-xl border border-slate-200 bg-white p-6'}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-medium text-indigo-600">{CATEGORY_LABELS[document.category]}</p>
          <h2 className="text-lg font-semibold">{document.title}</h2>
          {preview && (
            <p className="mt-1 text-xs text-slate-500">
              Visible to: <span className="capitalize">{document.allowed_roles.join(', ')}</span>
              {document.original_filename && <> · Source file: {document.original_filename}</>}
            </p>
          )}
        </div>
        {onAsk && (
          <button
            onClick={() => onAsk(document)}
            className="rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Ask the assistant about this
          </button>
        )}
      </div>
      {document.category === 'checklist' && !preview ? (
        <Checklist documentId={document.id} markdown={body} />
      ) : (
        <Markdown>{body || '_This document has no text content yet._'}</Markdown>
      )}
    </article>
  )
}
