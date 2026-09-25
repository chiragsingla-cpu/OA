import type { ReactNode } from 'react'

export default function Alert({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={`rounded border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger ${className}`}>
      {children}
    </p>
  )
}
