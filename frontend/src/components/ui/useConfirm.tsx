import { useCallback, useState, type ReactNode } from 'react'
import Modal from './Modal'

interface ConfirmOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  danger?: boolean
}

type PendingConfirm = ConfirmOptions & { resolve: (confirmed: boolean) => void }

/**
 * Promise-based confirmation dialog, used in place of window.confirm:
 *
 *   const { confirm, confirmModal } = useConfirm()
 *   if (!(await confirm({ title: 'Delete?', message: '…', danger: true }))) return
 *   ...render {confirmModal} somewhere in the component
 */
export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  )

  const close = useCallback(
    (confirmed: boolean) => {
      pending?.resolve(confirmed)
      setPending(null)
    },
    [pending],
  )
  const cancel = useCallback(() => close(false), [close])

  const confirmModal = pending && (
    <Modal
      title={pending.title}
      onClose={cancel}
      footer={
        <>
          {/* Focus starts on Cancel for dangerous actions, so a stray Enter doesn't delete anything. */}
          <button
            onClick={cancel}
            autoFocus={pending.danger}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={() => close(true)}
            autoFocus={!pending.danger}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              pending.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {pending.confirmLabel ?? 'Confirm'}
          </button>
        </>
      }
    >
      {pending.message}
    </Modal>
  )

  return { confirm, confirmModal }
}
