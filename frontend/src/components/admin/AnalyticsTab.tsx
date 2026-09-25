import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { QUESTION_CATEGORY_LABELS, type Analytics } from '../../api/types'
import Alert from '../ui/Alert'
import PageHeader from '../ui/PageHeader'
import { muted, panel, table, td, th } from '../ui/styles'

export default function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Analytics>('/admin/analytics')
      .then(({ data }) => setData(data))
      .catch((err) => setError(errorMessage(err)))
  }, [])

  const header = <PageHeader title="Analytics" summary="What employees ask Annie." />
  if (error) {
    return (
      <div>
        {header}
        <Alert>{error}</Alert>
      </div>
    )
  }
  if (!data) {
    return (
      <div>
        {header}
        <p className={muted}>Loading…</p>
      </div>
    )
  }

  const categories = Object.entries(data.questions_by_category)
  const max = Math.max(1, ...categories.map(([, count]) => count))

  return (
    <div className="space-y-4">
      {header}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.entries(data.totals).map(([label, value]) => (
          <div key={label} className={`${panel} px-4 py-3.5`}>
            <p className="text-xs text-muted capitalize">{label}</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <section className={`${panel} p-5`}>
        <h2 className="mb-4 text-[15px] font-semibold">Questions by type</h2>
        {categories.length === 0 && <p className={muted}>No questions asked yet.</p>}
        <ul className="space-y-2.5">
          {categories.map(([category, count]) => (
            <li key={category} className="grid grid-cols-[160px_1fr_40px] items-center gap-3 text-[13px]">
              <span className="text-muted">{QUESTION_CATEGORY_LABELS[category] ?? category}</span>
              <div className="h-2 rounded-sm bg-subtle">
                <div className="h-2 rounded-sm bg-brand" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="text-right font-semibold tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${panel} overflow-x-auto`}>
        <h2 className="px-5 py-3.5 text-[15px] font-semibold">Recent questions</h2>
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>User</th>
              <th className={th}>Question</th>
              <th className={th}>Type</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_questions.map((question) => (
              <tr key={question.id} className="hover:bg-subtle">
                <td className={`${td} whitespace-nowrap text-muted`}>{question.user}</td>
                <td className={td}>{question.content}</td>
                <td className={`${td} whitespace-nowrap text-xs text-muted`}>
                  {QUESTION_CATEGORY_LABELS[question.category ?? 'unanswered'] ?? question.category}
                </td>
              </tr>
            ))}
            {data.recent_questions.length === 0 && (
              <tr>
                <td colSpan={3} className={`${td} text-center text-muted`}>
                  No questions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
