import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import type { Conversation } from '../../api/types'
import Button from '../ui/Button'

/** "10:43" for today, otherwise "25 Sep". */
function formatWhen(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  const today = new Date().toDateString() === date.toDateString()
  return today
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
}: {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}) {
  const [filter, setFilter] = useState('')
  const shown = conversations.filter((c) => c.title.toLowerCase().includes(filter.trim().toLowerCase()))

  return (
    <aside className="flex max-h-56 min-h-0 flex-col border-b border-line md:max-h-none md:border-r md:border-b-0">
      <div className="space-y-3 border-b border-line p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Conversations</h2>
          <Button size="sm" onClick={onNew}>
            <Plus size={14} />
            New
          </Button>
        </div>
        <label className="flex h-[34px] items-center gap-2 rounded border border-line bg-subtle px-2.5 text-faint focus-within:border-brand">
          <Search size={15} />
          <span className="sr-only">Filter conversations</span>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter conversations"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
          />
        </label>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {shown.map((conversation) => {
          const active = conversation.id === activeId
          return (
            <li key={conversation.id} className="border-b border-line">
              <button
                onClick={() => onSelect(conversation.id)}
                aria-current={active ? 'true' : undefined}
                title={conversation.title}
                className={`block w-full px-4 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${
                  active ? 'bg-brand-soft shadow-[inset_3px_0_0_var(--color-brand)]' : 'hover:bg-subtle'
                }`}
              >
                <span className="block truncate text-[13px] font-semibold">{conversation.title}</span>
                <span className="block text-xs text-faint">{formatWhen(conversation.updated_at)}</span>
              </button>
            </li>
          )
        })}
        {shown.length === 0 && (
          <li className="px-4 py-3 text-xs text-faint">{conversations.length ? 'No matching conversations' : 'No conversations yet'}</li>
        )}
      </ul>
    </aside>
  )
}
