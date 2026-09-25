import type { InputHTMLAttributes, ReactNode } from 'react'

/** Shared look for text inputs, selects and textareas. */
export const inputClass =
  'w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand-soft disabled:bg-subtle disabled:text-muted'

/** A label above any form control. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</span>
      {children}
    </label>
  )
}

/** Label + text input in one, used on the sign-in and register pages. */
export function TextField({ label, ...inputProps }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label}>
      <input {...inputProps} className={`${inputClass} h-[42px]`} />
    </Field>
  )
}
