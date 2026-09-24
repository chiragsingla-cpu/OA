export interface TabItem<T extends string> {
  id: T
  label: string
}

export default function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem<T>[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${
            tab.id === active
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
