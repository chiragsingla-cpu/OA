import { AnnieAvatar } from './MessageBubble'

/** Shown while Annie is answering. */
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3.5 bg-subtle px-5 py-4 md:px-7" role="status">
      <AnnieAvatar />
      <span className="flex gap-1" aria-hidden>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </span>
      <span className="text-[13px] text-muted">Annie is searching documents</span>
    </div>
  )
}
