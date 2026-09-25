import { Search, Upload } from 'lucide-react'
import { CATEGORY_LABELS, type DocumentCategory, type DocumentStatus } from '../../api/types'
import Button from '../ui/Button'

export interface DocumentFilters {
  query: string
  category: DocumentCategory | 'all'
  status: DocumentStatus | 'all'
}

const selectClass = 'h-[34px] rounded border border-line bg-surface px-2 text-[13px] text-ink outline-none focus:border-brand'

/** Search box, category and status filters, and the "Add document" button. */
export default function DocumentsToolbar({
  filters,
  onChange,
  onAdd,
}: {
  filters: DocumentFilters
  onChange: (filters: DocumentFilters) => void
  onAdd?: () => void
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded border border-line bg-surface p-3">
      <label className="flex h-[34px] w-full items-center gap-2 rounded border border-line bg-subtle px-2.5 text-faint focus-within:border-brand sm:w-72">
        <Search size={15} />
        <span className="sr-only">Search documents</span>
        <input
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search by title or file"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
        />
      </label>
      <label className="flex items-center gap-2 text-[13px] text-muted">
        Category
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value as DocumentFilters['category'] })}
          className={selectClass}
        >
          <option value="all">All</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-[13px] text-muted">
        Status
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as DocumentFilters['status'] })}
          className={selectClass}
        >
          <option value="all">All</option>
          <option value="indexed">Indexed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </label>
      {onAdd && (
        <Button onClick={onAdd} className="ml-auto">
          <Upload size={15} />
          Add document
        </Button>
      )}
    </div>
  )
}
