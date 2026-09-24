import axios from 'axios'
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { api, errorMessage } from '../api/client'
import type { ChatMessage, Conversation } from '../api/types'
import ConversationList from './chat/ConversationList'
import EmptyChat from './chat/EmptyChat'
import MessageBubble from './chat/MessageBubble'

interface ChatResponse {
  conversation: Conversation
  message: ChatMessage
}

/**
 * @param draft text to pre-fill in the input (e.g. from "Ask about this document"), consumed once.
 */
export default function ChatPanel({ draft, onDraftConsumed }: { draft?: string; onDraftConsumed?: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const loadConversations = useCallback(async () => {
    const { data } = await api.get<{ conversations: Conversation[] }>('/conversations')
    setConversations(data.conversations)
  }, [])

  useEffect(() => {
    loadConversations().catch((err) => setError(errorMessage(err)))
  }, [loadConversations])

  useEffect(() => {
    if (draft) {
      setInput(draft)
      inputRef.current?.focus()
      onDraftConsumed?.()
    }
  }, [draft, onDraftConsumed])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function openConversation(id: string) {
    setError(null)
    setActiveId(id)
    try {
      const { data } = await api.get<{ messages: ChatMessage[] }>(`/conversations/${id}/messages`)
      setMessages(data.messages)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  function newChat() {
    setActiveId(null)
    setMessages([])
    setError(null)
    inputRef.current?.focus()
  }

  async function send(text: string) {
    const message = text.trim()
    if (!message || sending) return

    setError(null)
    setInput('')
    setSending(true)
    setMessages((current) => [...current, { id: `pending-${Date.now()}`, role: 'user', content: message }])

    try {
      const { data } = await api.post<ChatResponse>('/chat', { message, conversation_id: activeId })
      setActiveId(data.conversation.id)
      setMessages((current) => [...current, data.message])
    } catch (err) {
      // On a 503 the question was still saved, so keep the conversation selected.
      if (axios.isAxiosError(err) && err.response?.data?.conversation?.id) {
        setActiveId(err.response.data.conversation.id)
      }
      setError(errorMessage(err))
    } finally {
      setSending(false)
      loadConversations().catch(() => undefined)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    send(input)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send(input)
    }
  }

  return (
    <div className="grid h-[calc(100vh-12rem)] min-h-[480px] grid-rows-[auto_1fr] gap-4 md:grid-cols-[240px_1fr] md:grid-rows-1">
      <ConversationList conversations={conversations} activeId={activeId} onSelect={openConversation} onNew={newChat} />

      <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && !sending && <EmptyChat onPick={send} />}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {sending && (
            <div className="flex">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">Searching documents…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={2000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about policies, onboarding, projects…"
            className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  )
}
