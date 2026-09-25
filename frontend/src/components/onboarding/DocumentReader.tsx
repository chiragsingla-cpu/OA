import { MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { CATEGORY_LABELS, type DocumentItem } from '../../api/types'
import Markdown from '../Markdown'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import { muted, panel } from '../ui/styles'
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

  if (error) return <Alert>{error}</Alert>
  if (!document) return <p className={muted}>Loading…</p>

  const body = document.body_text ?? ''
  const preview = !onAsk

  return (
    <article className={preview ? '' : `${panel} px-6 py-6 md:px-8`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-brand uppercase">{CATEGORY_LABELS[document.category]}</p>
          <h2 className="mt-1 text-xl font-semibold">{document.title}</h2>
          {preview && (
            <p className="mt-1 text-xs text-muted">
              Visible to: <span className="capitalize">{document.allowed_roles.join(', ')}</span>
              {document.original_filename && <> · Source file: {document.original_filename}</>}
            </p>
          )}
        </div>
        {onAsk && (
          <Button variant="secondary" onClick={() => onAsk(document)}>
            <MessageSquare size={15} className="text-brand" />
            Ask Annie about this
          </Button>
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
