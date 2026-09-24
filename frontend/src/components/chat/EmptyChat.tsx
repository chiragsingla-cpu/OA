const SUGGESTIONS = [
  'How many days of annual leave do I get?',
  'What should I do on my first day?',
  'What are the core working hours?',
  'What is the scope of the employee self-service portal?',
]

export default function EmptyChat({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <h2 className="text-lg font-semibold">Ask the assistant</h2>
      <p className="mt-1 text-sm text-slate-500">Answers come from company documents you have access to.</p>
      <div className="mt-6 grid gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onPick(suggestion)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
