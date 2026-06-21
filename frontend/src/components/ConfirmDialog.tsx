import { IconAlert } from './icons';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = 'Emin misiniz?',
  message = 'Bu işlem uygulanacak.',
  confirmLabel = 'Onayla',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm animate-scale-in rounded-2xl border border-line bg-elevated p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/12 text-rose-500">
          <IconAlert width={20} height={20} />
        </div>
        <h3 className="text-base font-semibold text-content">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-subtle">{message}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button onClick={onCancel} className="btn-secondary h-9">
            Vazgeç
          </button>
          <button onClick={onConfirm} className="btn-danger h-9">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
