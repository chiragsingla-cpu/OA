import type { InputHTMLAttributes, ReactNode } from 'react'

export default function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
            Me
          </span>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({
  label,
  ...inputProps
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        {...inputProps}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  )
}
