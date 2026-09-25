import { Check } from 'lucide-react'
import type { OnboardingProgress } from '../../api/types'

type Checklist = OnboardingProgress['checklists'][number]

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
    <div className="grid gap-5 md:grid-cols-2">
      {checklists.map((checklist) => {
        const done = new Set(completed[checklist.id] ?? [])
        return (
          <div key={checklist.id}>
            <h4 className="mb-2 text-xs font-semibold tracking-wider text-faint uppercase">{checklist.title}</h4>
            <ul className="space-y-1.5 text-[13px]">
              {checklist.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  {done.has(index) ? (
                    <span aria-hidden className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm bg-ok text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : (
                    <span aria-hidden className="mt-0.5 size-4 shrink-0 rounded-sm border border-faint" />
                  )}
                  <span className={done.has(index) ? 'text-ink' : 'text-muted'}>
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
