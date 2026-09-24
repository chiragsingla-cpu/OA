export type Role = 'admin' | 'employee'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface OnboardingProgress {
  checklists: { id: string; title: string; items: string[] }[]
  employees: { id: string; name: string; email: string; completed: Record<string, number[]> }[]
}

export type DocumentCategory = 'hr_policy' | 'brd' | 'checklist' | 'handbook'

export type DocumentStatus = 'pending' | 'indexed' | 'failed'

export interface DocumentItem {
  id: string
  title: string
  category: DocumentCategory
  body_text?: string | null
  original_filename?: string | null
  allowed_roles: Role[]
  status: DocumentStatus
  chunk_count?: number
  error?: string | null
  updated_at?: string
}

export interface Source {
  document_id: string
  title: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  category?: string | null
  sources?: Source[]
}

export interface Conversation {
  id: string
  title: string
  updated_at?: string
}

export interface Analytics {
  totals: { questions: number; conversations: number; documents: number; users: number }
  questions_by_category: Record<string, number>
  recent_questions: { id: string; user: string; content: string; category: string | null; created_at: string }[]
}

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  checklist: 'Checklists',
  handbook: 'Company Handbook',
  hr_policy: 'HR Policies',
  brd: 'Business Requirements (BRDs)',
}

export const QUESTION_CATEGORY_LABELS: Record<string, string> = {
  general_docs: 'Company docs',
  onboarding: 'Onboarding',
  account_specific: 'Personal / account',
  out_of_scope: 'Out of scope',
  unanswered: 'Unanswered (AI Key issue)',
}
