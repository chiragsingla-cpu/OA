import { Fragment, useEffect, useState } from 'react'
import { api, errorMessage } from '../../api/client'
import type { OnboardingProgress } from '../../api/types'
import ChecklistProgressDetail, { ProgressBar } from './ChecklistProgressDetail'

/**
 * Each employee's progress on the onboarding checklists. Click a row to see the items.
 */
export default function OnboardingProgressTab() {
  const [data, setData] = useState<OnboardingProgress | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<OnboardingProgress>('/admin/onboarding-progress')
      .then(({ data }) => setData(data))
      .catch((err) => setError(errorMessage(err)))
  }, [])

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>
  if (data.checklists.length === 0) {
    return <p className="text-sm text-slate-500">No checklist documents are shared with employees yet.</p>
  }
  if (data.employees.length === 0) return <p className="text-sm text-slate-500">There are no employees yet.</p>

  const doneCount = (employeeCompleted: Record<string, number[]>, checklistId: string, total: number) =>
    (employeeCompleted[checklistId] ?? []).filter((index) => index < total).length

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-2">Employee</th>
            {data.checklists.map((checklist) => (
              <th key={checklist.id} className="px-4 py-2">
                {checklist.title}
              </th>
            ))}
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.employees.map((employee) => {
            const expanded = expandedId === employee.id
            return (
              <Fragment key={employee.id}>
                <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setExpandedId(expanded ? null : employee.id)}>
                  <td className="px-4 py-2">
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-xs text-slate-400">{employee.email}</div>
                  </td>
                  {data.checklists.map((checklist) => (
                    <td key={checklist.id} className="px-4 py-2">
                      <ProgressBar
                        done={doneCount(employee.completed, checklist.id, checklist.items.length)}
                        total={checklist.items.length}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right">
                    <button
                      aria-expanded={expanded}
                      className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    >
                      {expanded ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
                {expanded && (
                  <tr>
                    <td colSpan={data.checklists.length + 2} className="bg-slate-50 px-4 py-4">
                      <ChecklistProgressDetail checklists={data.checklists} completed={employee.completed} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
