const SUGGESTIONS = [
  'How many days of annual leave do I get?',
  'What should I do on my first day?',
  'What are the core working hours?',
  'What is the scope of the employee self-service portal?',
]

export default function EmptyChat({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <h2 className="text-lg font-semibold">Ask Annie</h2>
      <p className="mt-1 text-sm text-muted">
        Annie answers from the company documents you have access to, and names the source of every answer.
      </p>
      <p className="mt-6 mb-2 text-xs font-semibold tracking-wider text-faint uppercase">Try asking</p>
      <ul className="overflow-hidden rounded border border-line">
        {SUGGESTIONS.map((suggestion) => (
          <li key={suggestion} className="border-b border-line last:border-b-0">
            <button
              onClick={() => onPick(suggestion)}
              className="block w-full px-4 py-2.5 text-left text-sm text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
