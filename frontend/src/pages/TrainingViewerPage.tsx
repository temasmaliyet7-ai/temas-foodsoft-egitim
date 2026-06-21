import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTraining } from '../api/trainings';
import { apiErrorMessage } from '../api/client';
import { Spinner } from '../components/Spinner';
import { useSwipe } from '../hooks/useSwipe';
import { useFullscreen } from '../hooks/useFullscreen';
import { IconArrowLeft, IconArrowRight, IconMaximize, IconX } from '../components/icons';

export function TrainingViewerPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['training', id],
    queryFn: () => fetchTraining(id),
    enabled: !!id,
  });

  const [page, setPage] = useState(1);
  const fsContainerRef = useRef<HTMLDivElement | null>(null);
  const { isFullscreen, enter, exit } = useFullscreen();

  const pages = data?.pages ?? [];
  const total = pages.length;
  const current = pages[page - 1];

  const go = useCallback(
    (delta: number) => {
      setPage((p) => {
        const next = p + delta;
        if (next < 1 || next > total) return p;
        return next;
      });
    },
    [total],
  );

  useEffect(() => setPage(1), [id]);

  // Komşu sayfaları önden yükle
  useEffect(() => {
    [pages[page - 2], pages[page]].forEach((p) => {
      if (p) {
        const img = new Image();
        img.src = p.image_url;
      }
    });
  }, [page, pages]);

  // Klavye navigasyonu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Escape' && isFullscreen) exit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, isFullscreen, exit]);

  const stageRef = useSwipe<HTMLDivElement>({ onLeft: () => go(1), onRight: () => go(-1) });
  const fsSwipeRef = useSwipe<HTMLDivElement>({ onLeft: () => go(1), onRight: () => go(-1) });

  const pageLabel = useMemo(() => `${page} / ${total || 1}`, [page, total]);

  if (isLoading)
    return (
      <div className="grid place-items-center py-24">
        <Spinner label="Eğitim yükleniyor…" />
      </div>
    );

  if (error)
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm font-medium text-rose-600 dark:text-rose-400">
        {apiErrorMessage(error)}
      </div>
    );

  if (!data) return null;

  return (
    <div>
      {/* Başlık satırı */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-line bg-surface text-subtle transition-colors hover:bg-elevated hover:text-content"
            aria-label="Geri"
          >
            <IconArrowLeft width={17} height={17} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-content">{data.title}</h1>
            {data.subtitle && <p className="truncate text-sm text-subtle">{data.subtitle}</p>}
          </div>
        </div>
        <button
          onClick={() => fsContainerRef.current && enter(fsContainerRef.current)}
          disabled={total === 0}
          className="btn-secondary h-9"
        >
          <IconMaximize width={16} height={16} />
          <span className="hidden sm:inline">Tam ekran</span>
        </button>
      </div>

      {total === 0 ? (
        <div className="card grid place-items-center py-24 text-sm text-subtle">
          Bu eğitimde henüz sayfa yok.
        </div>
      ) : (
        <div>
          {/* Sahne */}
          <div
            ref={stageRef}
            className="relative grid min-h-[58vh] cursor-grab touch-pan-y select-none place-items-center overflow-hidden rounded-2xl border border-line bg-elevated p-2 active:cursor-grabbing"
          >
            <img
              src={current?.image_url}
              alt={`${data.title} — Sayfa ${page}`}
              draggable={false}
              className="max-h-[72vh] w-full rounded-lg object-contain"
            />
          </div>

          {/* Kontroller */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button onClick={() => go(-1)} disabled={page === 1} className="btn-secondary h-9 w-9 p-0">
              <IconArrowLeft width={17} height={17} />
            </button>
            <span className="min-w-[72px] text-center text-sm font-semibold tabular-nums text-subtle">
              {pageLabel}
            </span>
            <button onClick={() => go(1)} disabled={page === total} className="btn-secondary h-9 w-9 p-0">
              <IconArrowRight width={17} height={17} />
            </button>
          </div>
        </div>
      )}

      {/* Tam ekran katmanı */}
      <div
        ref={fsContainerRef}
        className={`fixed inset-0 z-[9999] bg-black ${isFullscreen ? 'flex' : 'hidden'} items-center justify-center`}
      >
        <div ref={fsSwipeRef} className="grid h-full w-full touch-pan-y place-items-center">
          {current && (
            <img
              src={current.image_url}
              alt={`${data.title} — Sayfa ${page}`}
              draggable={false}
              className="h-full w-full select-none object-contain"
            />
          )}
        </div>
        <button
          onClick={exit}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          aria-label="Kapat"
        >
          <IconX width={20} height={20} />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold tabular-nums text-white backdrop-blur">
          {pageLabel}
        </div>
      </div>
    </div>
  );
}
