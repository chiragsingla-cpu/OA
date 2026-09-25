import { Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import type { DocumentItem } from '../../api/types'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import { muted } from '../ui/styles'

type FileKind = 'pdf' | 'docx' | 'other'

function kindOf(filename: string): FileKind {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension === 'pdf' ? 'pdf' : extension === 'docx' ? 'docx' : 'other'
}

/**
 * Shows a document's original uploaded file: PDFs in the browser's own viewer, Word files rendered to HTML,
 * and a download button for every type. The file comes through the API (with the auth token), never straight
 * from storage.
 */
export default function OriginalFileViewer({ document }: { document: DocumentItem }) {
  const [file, setFile] = useState<{ blob: Blob; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const docxContainer = useRef<HTMLDivElement>(null)
  const filename = document.original_filename ?? 'document'
  const kind = kindOf(filename)

  useEffect(() => {
    let cancelled = false
    let url: string | null = null
    setFile(null)
    setError(null)
    api
      .get<Blob>(`/documents/${document.id}/file`, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelled) return
        const blob = kind === 'pdf' ? new Blob([data], { type: 'application/pdf' }) : data
        url = URL.createObjectURL(blob)
        setFile({ blob, url })
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load the original file.')))
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [document.id, kind])

  useEffect(() => {
    const container = docxContainer.current
    if (kind !== 'docx' || !file || !container) return
    // Loaded on demand so the Word renderer is not part of the main bundle.
    import('docx-preview')
      .then(({ renderAsync }) => renderAsync(file.blob, container, undefined, { inWrapper: false, ignoreWidth: true }))
      .catch(() => setError('Could not display this Word file. Download it to open it in Word.'))
  }, [kind, file])

  function download() {
    if (!file) return
    const link = window.document.createElement('a')
    link.href = file.url
    link.download = filename
    link.click()
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className={`${muted} truncate`}>{filename}</p>
        <Button variant="secondary" size="sm" onClick={download} disabled={!file}>
          <Download size={14} />
          Download original
        </Button>
      </div>
      {error ? (
        <Alert>{error}</Alert>
      ) : !file ? (
        <p className={muted}>Loading file…</p>
      ) : kind === 'pdf' ? (
        <iframe src={file.url} title={filename} className="h-[75vh] w-full rounded border border-line" />
      ) : kind === 'docx' ? (
        <div ref={docxContainer} className="overflow-x-auto rounded border border-line bg-white p-4" />
      ) : (
        <p className={muted}>This file's content is shown in the Text view. Use the button above to download it.</p>
      )}
    </div>
  )
}
