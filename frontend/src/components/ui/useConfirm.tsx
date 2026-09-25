import { useCallback, useState, type ReactNode } from 'react'
import Button from './Button'
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
          <Button variant="secondary" onClick={cancel} autoFocus={pending.danger}>
            Cancel
          </Button>
          <Button variant={pending.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus={!pending.danger}>
            {pending.confirmLabel ?? 'Confirm'}
          </Button>
        </>
      }
    >
      {pending.message}
    </Modal>
  )

  return { confirm, confirmModal }
}
