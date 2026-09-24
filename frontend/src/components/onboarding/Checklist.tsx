import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import Markdown from '../Markdown'

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
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span>
            {completed}/{itemCount} done
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {blocks.map((block, i) =>
        block.kind === 'text' ? (
          <Markdown key={`t${i}`}>{block.text}</Markdown>
        ) : (
          <label key={`i${block.index}`} className="flex cursor-pointer items-start gap-2 py-1 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-emerald-600"
              checked={done.includes(block.index)}
              onChange={() => toggle(block.index)}
            />
            <span className={done.includes(block.index) ? 'text-slate-400 line-through' : ''}>{block.label}</span>
          </label>
        ),
      )}
    </div>
  )
}
