import type { DocumentStatus } from '../../api/types'

const STATUS: Record<DocumentStatus, { label: string; color: string; dot: string }> = {
  indexed: { label: 'Indexed', color: 'text-ok', dot: 'bg-ok' },
  pending: { label: 'Pending', color: 'text-warn', dot: 'bg-warn' },
  failed: { label: 'Failed', color: 'text-danger', dot: 'bg-danger' },
}

/** Coloured dot + label for a document's indexing status. */
export default function StatusDot({ status, title }: { status: DocumentStatus; title?: string }) {
  const { label, color, dot } = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${color}`} title={title}>
      <span className={`size-2 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
