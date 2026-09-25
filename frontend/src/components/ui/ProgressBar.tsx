export default function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex min-w-36 items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-line">
        <div
          className={`h-1.5 rounded-full transition-all ${percent === 100 ? 'bg-ok' : 'bg-brand'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs text-muted tabular-nums">
        {done}/{total}
      </span>
    </div>
  )
}
