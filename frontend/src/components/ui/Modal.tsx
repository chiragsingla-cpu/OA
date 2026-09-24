import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Accessible dialog: closes on Escape, the × button, or a click on the backdrop.
 */
export default function Modal({
  title,
  children,
  footer,
  onClose,
  size = 'sm',
}: {
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  size?: 'sm' | 'lg'
}) {
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // stop the page scrolling behind the dialog
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[90vh] w-full flex-col rounded-2xl bg-white shadow-xl ${size === 'lg' ? 'max-w-3xl' : 'max-w-md'}`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3">
          <h2 id={titleId} className="font-semibold">
            {title}
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md px-2 text-xl leading-none text-slate-400 hover:bg-slate-100">
            ×
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4 text-sm text-slate-700">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
