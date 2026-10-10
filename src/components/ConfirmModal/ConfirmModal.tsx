import './ConfirmModal.css'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="confirm-modal-overlay"
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="confirm-modal-icon">
          !
        </div>

        <h2 id="confirm-modal-title">
          {title}
        </h2>

        <p id="confirm-modal-message">
          {message}
        </p>

        <div className="confirm-modal-actions">
          <button
            className="confirm-modal-cancel"
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>

          <button
            className="confirm-modal-confirm"
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal