import { useCallback, useState } from 'react'
import type { DocumentItem } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import ChatPanel from '../components/ChatPanel'
import Layout from '../components/Layout'
import OnboardingView from '../components/onboarding/OnboardingView'
import Tabs from '../components/Tabs'

type Tab = 'onboarding' | 'chat'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('onboarding')
  const [draft, setDraft] = useState<string>()

  const askAbout = useCallback((document: DocumentItem) => {
    setDraft(`Summarise the key points of "${document.title}".`)
    setTab('chat')
  }, [])
  const clearDraft = useCallback(() => setDraft(undefined), [])

  return (
    <Layout>
      <h1 className="text-2xl font-semibold">Hi {user?.name.split(' ')[0]} 👋</h1>
      <p className="mb-4 text-sm text-slate-500">Browse onboarding material or ask the assistant anything about company policies.</p>
      <Tabs
        tabs={[
          { id: 'onboarding', label: 'Onboarding' },
          { id: 'chat', label: 'Assistant' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {/* Both tabs stay mounted so the chat keeps its state while switching. */}
      <div className={tab === 'onboarding' ? '' : 'hidden'}>
        <OnboardingView onAsk={askAbout} />
      </div>
      <div className={tab === 'chat' ? '' : 'hidden'}>
        <ChatPanel draft={draft} onDraftConsumed={clearDraft} />
      </div>
    </Layout>
  )
}
