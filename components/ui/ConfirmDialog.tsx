"use client";
import Modal from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  success?: boolean;
  loading?: boolean;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Konfirmasi", danger = false, success = false, loading }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-400 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onClose}>Batal</button>
        <button className={danger ? "btn-danger" : success ? "btn-success" : "btn-primary"} onClick={onConfirm} disabled={loading}>
          {loading ? "Memproses..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
