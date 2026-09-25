import { FileText } from 'lucide-react'
import { QUESTION_CATEGORY_LABELS, type ChatMessage } from '../../api/types'
import Markdown from '../Markdown'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** One full-width message row: square avatar, name, then the text (Annie's rows add their sources). */
export default function MessageBubble({ message, userName }: { message: ChatMessage; userName: string }) {
  if (message.role === 'user') {
    return (
      <div className="flex gap-3.5 border-b border-line bg-surface px-5 py-4 md:px-7">
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded bg-[#f4c9a8] text-xs font-bold text-[#6b3413]">
          {initials(userName)}
        </span>
        <div className="min-w-0 max-w-3xl">
          <p className="text-[13px] font-semibold">You</p>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3.5 border-b border-line bg-subtle px-5 py-4 md:px-7">
      <AnnieAvatar />
      <div className="min-w-0 max-w-3xl">
        <p className="text-[13px] font-semibold">Annie</p>
        <Markdown className="mt-1">{message.content}</Markdown>
        {(message.sources?.length || message.category) && (
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            {!!message.sources?.length && (
              <>
                <FileText size={13} aria-hidden />
                Source:
                {message.sources.map((source, i) => (
                  <span key={source.document_id} className="font-medium text-brand">
                    {source.title}
                    {i < message.sources!.length - 1 && ','}
                  </span>
                ))}
              </>
            )}
            {message.category && (
              <span className="text-faint">· {QUESTION_CATEGORY_LABELS[message.category] ?? message.category}</span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

export function AnnieAvatar() {
  return (
    <span aria-hidden className="flex size-[30px] shrink-0 items-center justify-center rounded bg-brand text-xs font-bold text-white">
      A
    </span>
  )
}
