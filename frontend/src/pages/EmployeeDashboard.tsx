import { useCallback, useState } from 'react'
import type { DocumentItem } from '../api/types'
import ChatPanel from '../components/ChatPanel'
import Layout from '../components/Layout'
import OnboardingView from '../components/onboarding/OnboardingView'
import Tabs from '../components/Tabs'

type Tab = 'onboarding' | 'chat'

export default function EmployeeDashboard() {
  const [tab, setTab] = useState<Tab>('onboarding')
  const [draft, setDraft] = useState<string>()

  const askAbout = useCallback((document: DocumentItem) => {
    setDraft(`Summarise the key points of "${document.title}".`)
    setTab('chat')
  }, [])
  const clearDraft = useCallback(() => setDraft(undefined), [])

  return (
    <Layout
      nav={
        <Tabs
          tabs={[
            { id: 'onboarding', label: 'Onboarding' },
            { id: 'chat', label: 'Ask Annie' },
          ]}
          active={tab}
          onChange={setTab}
        />
      }
    >
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
