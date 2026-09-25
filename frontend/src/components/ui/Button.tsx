import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'link' | 'danger-link'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'rounded bg-brand font-semibold text-white hover:bg-brand-hover',
  secondary: 'rounded border border-line bg-surface font-medium text-ink hover:bg-subtle',
  danger: 'rounded bg-danger font-semibold text-white hover:bg-danger/90',
  link: 'rounded px-1 text-brand hover:underline',
  'danger-link': 'rounded px-1 text-danger hover:underline',
}

const SIZES: Record<Size, string> = {
  sm: 'h-[30px] px-3 text-[13px]',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-[15px]',
}

/** Buttons default to type="button"; pass type="submit" for form submits. Link variants take the surrounding text size. */
export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}: { variant?: Variant; size?: Size } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizing = variant.endsWith('link') ? '' : SIZES[size]
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${sizing} ${className}`}
      {...props}
    />
  )
}
