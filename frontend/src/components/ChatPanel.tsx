import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api, errorMessage } from '../api/client'
import type { ChatMessage, Conversation } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import ChatComposer from './chat/ChatComposer'
import ConversationList from './chat/ConversationList'
import EmptyChat from './chat/EmptyChat'
import MessageBubble from './chat/MessageBubble'
import TypingIndicator from './chat/TypingIndicator'
import Alert from './ui/Alert'

interface ChatResponse {
  conversation: Conversation
  message: ChatMessage
}

/**
 * @param draft text to pre-fill in the input (e.g. from "Ask about this document"), consumed once.
 */
export default function ChatPanel({ draft, onDraftConsumed }: { draft?: string; onDraftConsumed?: () => void }) {
  const { user } = useAuth()
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

  const title = conversations.find((c) => c.id === activeId)?.title ?? 'New conversation'

  return (
    <div className="grid h-[calc(100dvh-6.25rem)] min-h-[520px] grid-rows-[auto_1fr] overflow-hidden rounded border border-line bg-surface md:grid-cols-[290px_1fr] md:grid-rows-1">
      <ConversationList conversations={conversations} activeId={activeId} onSelect={openConversation} onNew={newChat} />

      <section className="flex min-h-0 flex-col">
        <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-x-4 border-b border-line px-5 py-2 md:px-7">
          <h2 className="truncate text-[15px] font-semibold">{title}</h2>
          <span className="text-xs text-muted">
            Answers use documents visible to the <span className="capitalize">{user?.role}</span> role
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !sending && <EmptyChat onPick={send} />}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} userName={user?.name ?? 'You'} />
          ))}
          {sending && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {error && <Alert className="mx-5 mb-1 md:mx-7">{error}</Alert>}

        <ChatComposer value={input} onChange={setInput} onSend={send} sending={sending} inputRef={inputRef} />
      </section>
    </div>
  )
}
