import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { CATEGORY_LABELS, type DocumentCategory, type DocumentItem } from '../../api/types'
import Alert from '../ui/Alert'
import { muted, panel } from '../ui/styles'
import DocumentReader from './DocumentReader'

const CATEGORY_ORDER: DocumentCategory[] = ['checklist', 'handbook', 'hr_policy', 'brd']

/**
 * Browsable onboarding content: documents grouped by category, plus a reader.
 */
export default function OnboardingView({ onAsk }: { onAsk: (document: DocumentItem) => void }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ documents: DocumentItem[] }>('/documents')
      .then(({ data }) => {
        setDocuments(data.documents)
        const firstChecklist = data.documents.find((doc) => doc.category === 'checklist') ?? data.documents[0]
        setSelectedId(firstChecklist?.id ?? null)
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className={muted}>Loading documents…</p>
  if (error) return <Alert>{error}</Alert>
  if (documents.length === 0) {
    return <p className={muted}>No onboarding documents have been published for your role yet.</p>
  }

  return (
    <div className="grid items-start gap-4 md:grid-cols-[280px_1fr]">
      <nav className={`${panel} overflow-hidden`} aria-label="Onboarding documents">
        {CATEGORY_ORDER.map((category) => {
          const items = documents.filter((doc) => doc.category === category)
          if (items.length === 0) return null
          return (
            <div key={category}>
              <h3 className="border-b border-line bg-subtle px-4 py-2 text-xs font-semibold tracking-wider text-muted uppercase">
                {CATEGORY_LABELS[category]}
              </h3>
              <ul>
                {items.map((doc) => {
                  const active = doc.id === selectedId
                  return (
                    <li key={doc.id} className="border-b border-line">
                      <button
                        onClick={() => setSelectedId(doc.id)}
                        aria-current={active ? 'true' : undefined}
                        className={`block w-full px-4 py-2.5 text-left text-[13px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${
                          active
                            ? 'bg-brand-soft font-semibold text-brand shadow-[inset_3px_0_0_var(--color-brand)]'
                            : 'text-ink hover:bg-subtle'
                        }`}
                      >
                        {doc.title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>
      {selectedId && <DocumentReader documentId={selectedId} onAsk={onAsk} />}
    </div>
  )
}
