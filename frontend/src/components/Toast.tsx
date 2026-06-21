import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { IconCheck, IconAlert, IconX } from './icons';

type ToastKind = 'info' | 'error' | 'success';
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<((message: string, kind?: ToastKind) => void) | undefined>(
  undefined,
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex animate-slide-up items-start gap-2.5 rounded-xl border border-line bg-elevated px-3.5 py-3 shadow-pop"
          >
            <span
              className={[
                'mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full',
                t.kind === 'error'
                  ? 'bg-rose-500/15 text-rose-500'
                  : t.kind === 'success'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-brand-500/15 text-brand-500',
              ].join(' ')}
            >
              {t.kind === 'error' ? (
                <IconAlert width={13} height={13} />
              ) : t.kind === 'success' ? (
                <IconCheck width={13} height={13} />
              ) : (
                <IconAlert width={13} height={13} />
              )}
            </span>
            <span className="flex-1 text-sm font-medium text-content">{t.message}</span>
            <button
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
              className="flex-none text-faint hover:text-content"
            >
              <IconX width={15} height={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast, ToastProvider içinde kullanılmalı.');
  return ctx;
}
