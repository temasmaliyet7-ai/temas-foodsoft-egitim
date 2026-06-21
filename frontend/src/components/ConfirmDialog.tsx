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
  confirmLabel = 'Evet',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-5 backdrop-blur-sm">
      <div className="w-full max-w-[440px] rounded-3xl border border-accent/30 bg-white p-6 text-center shadow-soft">
        <div className="mb-2 text-4xl">⚠️</div>
        <h3 className="text-2xl font-black tracking-tight text-ink">{title}</h3>
        <p className="mx-auto mt-2.5 max-w-[340px] text-muted">{message}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={onConfirm} className="btn-danger h-12">
            {confirmLabel}
          </button>
          <button onClick={onCancel} className="btn-ghost h-12">
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
