import { QUESTION_CATEGORY_LABELS, type ChatMessage } from '../../api/types'
import Markdown from '../Markdown'

export default function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-sm whitespace-pre-wrap text-white">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
        <Markdown>{message.content}</Markdown>
        {(message.sources?.length || message.category) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            {message.sources?.map((source) => (
              <span key={source.document_id} className="rounded-full bg-white px-2 py-0.5 text-slate-600 ring-1 ring-slate-200">
                📄 {source.title}
              </span>
            ))}
            {message.category && (
              <span className="text-slate-400">{QUESTION_CATEGORY_LABELS[message.category] ?? message.category}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
