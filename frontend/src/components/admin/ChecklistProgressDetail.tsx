import type { OnboardingProgress } from '../../api/types'

type Checklist = OnboardingProgress['checklists'][number]

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total ? Math.round((done / total) * 100) : 0
  const color = percent === 100 ? 'bg-emerald-500' : percent > 0 ? 'bg-indigo-500' : 'bg-slate-300'
  return (
    <div className="flex min-w-36 items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="w-12 text-right text-xs text-slate-500 tabular-nums">
        {done}/{total}
      </span>
    </div>
  )
}

/**
 * Item-by-item view of one employee's checklists.
 */
export default function ChecklistProgressDetail({
  checklists,
  completed,
}: {
  checklists: Checklist[]
  completed: Record<string, number[]>
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {checklists.map((checklist) => {
        const done = new Set(completed[checklist.id] ?? [])
        return (
          <div key={checklist.id}>
            <h4 className="mb-1 text-xs font-semibold text-slate-500">{checklist.title}</h4>
            <ul className="space-y-0.5 text-sm">
              {checklist.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span aria-hidden>{done.has(index) ? '✅' : '⬜'}</span>
                  <span className={done.has(index) ? 'text-slate-700' : 'text-slate-400'}>
                    {item}
                    <span className="sr-only">{done.has(index) ? ' (done)' : ' (not done)'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
