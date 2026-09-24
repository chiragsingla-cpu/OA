import { useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { QUESTION_CATEGORY_LABELS, type Analytics } from '../../api/types'

export default function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Analytics>('/admin/analytics')
      .then(({ data }) => setData(data))
      .catch((err) => setError(errorMessage(err)))
  }, [])

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>

  const categories = Object.entries(data.questions_by_category)
  const max = Math.max(1, ...categories.map(([, count]) => count))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(data.totals).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 capitalize">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">Questions by type</h3>
        {categories.length === 0 && <p className="text-sm text-slate-400">No questions asked yet.</p>}
        <ul className="space-y-2">
          {categories.map(([category, count]) => (
            <li key={category} className="grid grid-cols-[160px_1fr_40px] items-center gap-3 text-sm">
              <span className="text-slate-600">{QUESTION_CATEGORY_LABELS[category] ?? category}</span>
              <div className="h-2.5 rounded-full bg-slate-100">
                <div className="h-2.5 rounded-full bg-indigo-500" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="text-right tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <h3 className="px-5 pt-4 font-semibold">Recent questions</h3>
        <table className="mt-2 w-full text-left text-sm">
          <tbody className="divide-y divide-slate-100">
            {data.recent_questions.map((question) => (
              <tr key={question.id}>
                <td className="px-5 py-2 whitespace-nowrap text-slate-500">{question.user}</td>
                <td className="px-5 py-2">{question.content}</td>
                <td className="px-5 py-2 whitespace-nowrap text-xs text-slate-400">
                  {QUESTION_CATEGORY_LABELS[question.category ?? 'unanswered'] ?? question.category}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
