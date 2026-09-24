import type { Conversation } from '../../api/types'

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
  return (
    <aside className="flex max-h-40 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white md:max-h-none">
      <button
        onClick={onNew}
        className="m-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        + New chat
      </button>
      <ul className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <button
              onClick={() => onSelect(conversation.id)}
              className={`w-full truncate rounded-md px-2 py-1.5 text-left text-sm ${
                conversation.id === activeId ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
              title={conversation.title}
            >
              {conversation.title}
            </button>
          </li>
        ))}
        {conversations.length === 0 && <li className="px-2 py-1 text-xs text-slate-400">No conversations yet</li>}
      </ul>
    </aside>
  )
}
