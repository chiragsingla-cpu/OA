export interface TabItem<T extends string> {
  id: T
  label: string
}

/** Tabs shown inside the navy header (see Layout's `nav` prop). */
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
    <nav className="flex h-11 px-2 md:h-[52px] md:px-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          aria-current={tab.id === active ? 'page' : undefined}
          className={`px-3.5 text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-tab ${
            tab.id === active
              ? 'font-semibold text-white shadow-[inset_0_-3px_0_var(--color-tab)]'
              : 'text-navy-muted hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
