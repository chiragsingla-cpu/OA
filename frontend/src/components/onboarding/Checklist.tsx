import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import Markdown from '../Markdown'
import Alert from '../ui/Alert'

// Must match Document::checklistItems() in the Laravel API: item indexes are how progress is stored.
const ITEM = /^\s*[-*]\s\[[ xX]\]\s+(.*)$/

type Block = { kind: 'text'; text: string } | { kind: 'item'; index: number; label: string }

/** Splits markdown into plain text blocks and "- [ ] task" items. */
function parse(markdown: string): Block[] {
  const blocks: Block[] = []
  let buffer: string[] = []
  let index = 0
  const flush = () => {
    if (buffer.join('').trim()) blocks.push({ kind: 'text', text: buffer.join('\n') })
    buffer = []
  }
  for (const line of markdown.split('\n')) {
    const match = line.match(ITEM)
    if (match) {
      flush()
      blocks.push({ kind: 'item', index: index++, label: match[1] })
    } else {
      buffer.push(line)
    }
  }
  flush()
  return blocks
}

/**
 * Interactive checklist. Progress is saved per user on the server, so admins can follow it.
 */
export default function Checklist({ documentId, markdown }: { documentId: string; markdown: string }) {
  const blocks = parse(markdown)
  const itemCount = blocks.filter((block) => block.kind === 'item').length
  const [done, setDone] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDone([])
    api
      .get<{ completed: number[] }>(`/checklists/${documentId}/progress`)
      .then(({ data }) => setDone(data.completed))
      .catch((err) => setError(errorMessage(err, 'Could not load your progress.')))
  }, [documentId])

  async function toggle(index: number) {
    const previous = done
    const next = done.includes(index) ? done.filter((i) => i !== index) : [...done, index]
    setDone(next) // optimistic update; rolled back if saving fails
    setError(null)
    try {
      await api.put(`/checklists/${documentId}/progress`, { completed: next })
    } catch (err) {
      setDone(previous)
      setError(errorMessage(err, 'Could not save your progress.'))
    }
  }

  const completed = done.filter((index) => index < itemCount).length
  const percent = itemCount ? Math.round((completed / itemCount) * 100) : 0

  return (
    <div>
      <div className="mb-5 flex items-center gap-4 rounded border border-line bg-subtle px-4 py-3">
        <span className="text-lg font-semibold whitespace-nowrap tabular-nums">
          {completed}
          <span className="text-sm font-medium text-muted"> / {itemCount} done</span>
        </span>
        <div className="h-1.5 flex-1 rounded-full bg-line">
          <div className="h-1.5 rounded-full bg-ok transition-all" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-[13px] font-semibold text-ok tabular-nums">{percent}%</span>
      </div>
      {error && <Alert className="mb-3">{error}</Alert>}
      {blocks.map((block, i) =>
        block.kind === 'text' ? (
          <Markdown key={`t${i}`} className="my-2">
            {block.text}
          </Markdown>
        ) : (
          <label
            key={`i${block.index}`}
            className="flex cursor-pointer items-start gap-3 rounded px-2 py-2 text-sm hover:bg-subtle"
          >
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-brand"
              checked={done.includes(block.index)}
              onChange={() => toggle(block.index)}
            />
            <span className={done.includes(block.index) ? 'text-faint line-through' : ''}>{block.label}</span>
          </label>
        ),
      )}
    </div>
  )
}
