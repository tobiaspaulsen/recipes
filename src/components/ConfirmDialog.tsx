import { useEffect, useRef, useState } from 'react'

type Request = { message: string; confirmLabel: string; resolve: (confirmed: boolean) => void }

// Replaces window.confirm, which shows the site's address and the browser's own button labels.
export function useConfirm() {
  const [request, setRequest] = useState<Request | null>(null)

  const confirm = (message: string, confirmLabel: string) =>
    new Promise<boolean>((resolve) => setRequest({ message, confirmLabel, resolve }))

  const settle = (confirmed: boolean) => {
    request?.resolve(confirmed)
    setRequest(null)
  }

  const dialog = request && <ConfirmDialog message={request.message} confirmLabel={request.confirmLabel} onSettle={settle} />
  return [confirm, dialog] as const
}

type Props = { message: string; confirmLabel: string; onSettle: (confirmed: boolean) => void }

function ConfirmDialog({ message, confirmLabel, onSettle }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className="confirm"
      onCancel={(event) => {
        event.preventDefault()
        onSettle(false)
      }}
      // The dialog itself has no padding, so a click that lands on it directly is on the backdrop.
      onClick={(event) => event.target === ref.current && onSettle(false)}
    >
      <div className="confirm-body">
        <p>{message}</p>
        <div className="confirm-actions">
          <button type="button" className="button-secondary" onClick={() => onSettle(false)} autoFocus>
            Avbryt
          </button>
          <button type="button" className="button-primary" onClick={() => onSettle(true)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
