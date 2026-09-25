import { useState } from 'react'
import AnalyticsTab from '../components/admin/AnalyticsTab'
import DocumentsTab from '../components/admin/DocumentsTab'
import OnboardingProgressTab from '../components/admin/OnboardingProgressTab'
import UsersTab from '../components/admin/UsersTab'
import ChatPanel from '../components/ChatPanel'
import Layout from '../components/Layout'
import Tabs from '../components/Tabs'

type Tab = 'documents' | 'users' | 'onboarding' | 'analytics' | 'chat'

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('documents')

  return (
    <Layout
      nav={
        <Tabs
          tabs={[
            { id: 'documents', label: 'Documents' },
            { id: 'users', label: 'Users' },
            { id: 'onboarding', label: 'Onboarding progress' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'chat', label: 'Ask Annie' },
          ]}
          active={tab}
          onChange={setTab}
        />
      }
    >
      {tab === 'documents' && <DocumentsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'onboarding' && <OnboardingProgressTab />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'chat' && <ChatPanel />}
    </Layout>
  )
}
