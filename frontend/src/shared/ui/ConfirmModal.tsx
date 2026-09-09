import { AlertTriangle } from 'lucide-react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  busyLabel = 'Deleting…',
  busy = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <div className="modal-scrim animate-fade-in" onClick={busy ? undefined : onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <AlertTriangle size={20} />
        </div>
        <div className="confirm-body">
          <h3>{title}</h3>
          <p>{message}</p>
        </div>
        <div className="confirm-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}