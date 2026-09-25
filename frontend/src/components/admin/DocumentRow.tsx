import { Fragment } from 'react'
import { CATEGORY_LABELS, type DocumentItem } from '../../api/types'
import Button from '../ui/Button'
import StatusDot from '../ui/StatusDot'
import { td } from '../ui/styles'

export type DocumentAction = 'view' | 'edit' | 'reindex' | 'delete'

const ACTIONS: { action: DocumentAction; label: string }[] = [
  { action: 'view', label: 'View' },
  { action: 'edit', label: 'Edit' },
  { action: 'reindex', label: 'Reindex' },
  { action: 'delete', label: 'Delete' },
]

export default function DocumentRow({
  document,
  busy,
  onAction,
}: {
  document: DocumentItem
  busy: boolean
  onAction: (action: DocumentAction, document: DocumentItem) => void
}) {
  return (
    <tr className="hover:bg-subtle">
      <td className={`${td} font-semibold`}>{document.title}</td>
      <td className={`${td} font-mono text-xs text-muted`}>{document.original_filename ?? '—'}</td>
      <td className={td}>{CATEGORY_LABELS[document.category]}</td>
      <td className={`${td} capitalize`}>{document.allowed_roles.join(', ')}</td>
      <td className={`${td} whitespace-nowrap`}>
        <StatusDot status={document.status} title={document.error ?? undefined} />
        {document.status === 'indexed' && !!document.chunk_count && (
          <span className="ml-1.5 text-xs text-faint">{document.chunk_count} chunks</span>
        )}
      </td>
      <td className={`${td} text-right whitespace-nowrap`}>
        {ACTIONS.map(({ action, label }, i) => (
          <Fragment key={action}>
            {i > 0 && (
              <span aria-hidden className="text-line">
                {' | '}
              </span>
            )}
            <Button
              variant={action === 'delete' ? 'danger-link' : 'link'}
              disabled={busy}
              onClick={() => onAction(action, document)}
              aria-label={`${label} ${document.title}`}
            >
              {label}
            </Button>
          </Fragment>
        ))}
      </td>
    </tr>
  )
}
