import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { CATEGORY_LABELS, type DocumentCategory, type DocumentItem } from '../../api/types'
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

  if (loading) return <p className="text-sm text-slate-500">Loading documents…</p>
  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  if (documents.length === 0) {
    return <p className="text-sm text-slate-500">No onboarding documents have been published for your role yet.</p>
  }

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <nav className="space-y-5">
        {CATEGORY_ORDER.map((category) => {
          const items = documents.filter((doc) => doc.category === category)
          if (items.length === 0) return null
          return (
            <div key={category}>
              <h3 className="mb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">{CATEGORY_LABELS[category]}</h3>
              <ul className="space-y-0.5">
                {items.map((doc) => (
                  <li key={doc.id}>
                    <button
                      onClick={() => setSelectedId(doc.id)}
                      className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                        doc.id === selectedId ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {doc.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
      {selectedId && <DocumentReader documentId={selectedId} onAsk={onAsk} />}
    </div>
  )
}
