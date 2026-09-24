import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '../../api/client'
import { CATEGORY_LABELS, type DocumentCategory, type DocumentItem } from '../../api/types'

const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500'

/**
 * Create a document, or edit one (pass `document`). When editing, the content only changes if a new file or text is given.
 */
export default function DocumentForm({
  document,
  onSaved,
  onCancel,
}: {
  document?: DocumentItem
  onSaved: (document: DocumentItem) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(document?.title ?? '')
  const [category, setCategory] = useState<DocumentCategory>(document?.category ?? 'hr_policy')
  const [employeeAccess, setEmployeeAccess] = useState(document ? document.allowed_roles.includes('employee') : true)
  const [source, setSource] = useState<'keep' | 'file' | 'text'>(document ? 'keep' : 'file')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const form = new FormData()
    form.append('title', title)
    form.append('category', category)
    form.append('allowed_roles[]', 'admin')
    if (employeeAccess) form.append('allowed_roles[]', 'employee')
    if (source === 'file' && file) form.append('file', file)
    if (source === 'text') form.append('body_text', text)
    if (document) form.append('_method', 'PUT') // PHP only parses multipart bodies on POST

    setSaving(true)
    try {
      const url = document ? `/documents/${document.id}` : '/documents'
      const { data } = await api.post<{ document: DocumentItem }>(url, form)
      onSaved(data.document)
    } catch (err) {
      setError(errorMessage(err, 'Could not save the document.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold">{document ? `Edit "${document.title}"` : 'Add a document'}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Title</span>
          <input required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)} className={input}>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={employeeAccess} onChange={(e) => setEmployeeAccess(e.target.checked)} />
        Visible to employees <span className="text-slate-400">(admins can always see every document)</span>
      </label>

      <div className="flex flex-wrap gap-4 text-sm">
        {document && <Radio label="Keep current content" checked={source === 'keep'} onChange={() => setSource('keep')} />}
        <Radio label="Upload file" checked={source === 'file'} onChange={() => setSource('file')} />
        <Radio label="Type text" checked={source === 'text'} onChange={() => setSource('text')} />
      </div>
      {source === 'file' && (
        <input
          type="file"
          required
          accept=".pdf,.docx,.txt,.md"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block text-sm"
        />
      )}
      {source === 'text' && (
        <textarea
          required
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Markdown supported. Use '- [ ] item' lines for checklists."
          className={input}
        />
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Saving & indexing…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  )
}

function Radio({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-1.5">
      <input type="radio" checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}
