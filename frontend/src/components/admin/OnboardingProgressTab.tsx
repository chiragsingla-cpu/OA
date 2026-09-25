import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { api, errorMessage } from '../../api/client'
import type { OnboardingProgress } from '../../api/types'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import PageHeader from '../ui/PageHeader'
import ProgressBar from '../ui/ProgressBar'
import { muted, table, tableWrap, td, th } from '../ui/styles'
import ChecklistProgressDetail from './ChecklistProgressDetail'

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

  const header = <PageHeader title="Onboarding progress" summary="Checklist progress for each employee. Click a row to see the items." />

  const notice = (content: ReactNode) => (
    <div>
      {header}
      {content}
    </div>
  )

  if (error) return notice(<Alert>{error}</Alert>)
  if (!data) return notice(<p className={muted}>Loading…</p>)
  if (data.checklists.length === 0) return notice(<p className={muted}>No checklist documents are shared with employees yet.</p>)
  if (data.employees.length === 0) return notice(<p className={muted}>There are no employees yet.</p>)

  const doneCount = (employeeCompleted: Record<string, number[]>, checklistId: string, total: number) =>
    (employeeCompleted[checklistId] ?? []).filter((index) => index < total).length

  return (
    <div>
      {header}
      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Employee</th>
              {data.checklists.map((checklist) => (
                <th key={checklist.id} className={th}>
                  {checklist.title}
                </th>
              ))}
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {data.employees.map((employee) => {
              const expanded = expandedId === employee.id
              return (
                <Fragment key={employee.id}>
                  <tr className="cursor-pointer hover:bg-subtle" onClick={() => setExpandedId(expanded ? null : employee.id)}>
                    <td className={td}>
                      <div className="font-semibold">{employee.name}</div>
                      <div className="text-xs text-faint">{employee.email}</div>
                    </td>
                    {data.checklists.map((checklist) => (
                      <td key={checklist.id} className={td}>
                        <ProgressBar
                          done={doneCount(employee.completed, checklist.id, checklist.items.length)}
                          total={checklist.items.length}
                        />
                      </td>
                    ))}
                    <td className={`${td} text-right`}>
                      <Button variant="link" aria-expanded={expanded}>
                        {expanded ? 'Hide' : 'Details'}
                      </Button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={data.checklists.length + 2} className="border-b border-line bg-subtle px-4 py-4">
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
    </div>
  )
}
