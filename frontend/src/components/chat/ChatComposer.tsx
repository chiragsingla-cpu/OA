import { Send } from 'lucide-react'
import type { FormEvent, KeyboardEvent, RefObject } from 'react'
import Button from '../ui/Button'
import { inputClass } from '../ui/form'

/** Question box: Enter sends, Shift+Enter adds a new line. */
export default function ChatComposer({
  value,
  onChange,
  onSend,
  sending,
  inputRef,
}: {
  value: string
  onChange: (value: string) => void
  onSend: (text: string) => void
  sending: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSend(value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSend(value)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2.5 border-t border-line px-5 py-4 md:px-7">
      <label className="flex-1">
        <span className="mb-1.5 block text-xs font-semibold text-muted">Your question</span>
        <textarea
          ref={inputRef}
          rows={2}
          value={value}
          maxLength={2000}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a question about policies, benefits or onboarding"
          className={`${inputClass} resize-none`}
        />
      </label>
      <Button type="submit" size="lg" disabled={sending || !value.trim()} className="mb-0.5">
        Send
        <Send size={15} />
      </Button>
    </form>
  )
}
