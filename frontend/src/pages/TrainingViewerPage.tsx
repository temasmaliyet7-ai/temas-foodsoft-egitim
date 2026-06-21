import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTraining } from '../api/trainings';
import { apiErrorMessage } from '../api/client';
import { Spinner } from '../components/Spinner';
import { useSwipe } from '../hooks/useSwipe';
import { useFullscreen } from '../hooks/useFullscreen';

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

  // Eğitim değişince başa sar
  useEffect(() => setPage(1), [id]);

  // Komşu sayfaları önden yükle (akıllı ön yükleme)
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
      <div className="grid place-items-center py-20">
        <Spinner label="Eğitim yükleniyor..." />
      </div>
    );

  if (error)
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-center font-bold text-red-600">
        {apiErrorMessage(error)}
      </div>
    );

  if (!data) return null;

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="mb-3 flex items-center justify-between gap-3 rounded-3xl border border-accent/15 bg-white/80 px-4 py-3 shadow-card">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-ink sm:text-2xl">{data.title}</h2>
          {data.subtitle && <p className="truncate text-sm text-muted">{data.subtitle}</p>}
        </div>
        <div className="flex flex-none items-center gap-2">
          <button
            onClick={() => fsContainerRef.current && enter(fsContainerRef.current)}
            className="btn-accent h-10 px-4 text-sm"
            disabled={total === 0}
          >
            ⛶ Tam Ekran
          </button>
          <Link to="/" className="btn-ghost h-10 px-4 text-sm">
            Ana Sayfa
          </Link>
        </div>
      </div>

      {total === 0 ? (
        <div className="card grid place-items-center p-16 text-muted">Bu eğitimde henüz sayfa yok.</div>
      ) : (
        <div className="rounded-3xl border border-accent/15 bg-white/80 p-2.5 shadow-soft">
          <div
            ref={stageRef}
            className="relative grid min-h-[60vh] cursor-grab touch-pan-y place-items-center overflow-hidden rounded-2xl bg-white"
          >
            <img
              src={current?.image_url}
              alt={`${data.title} - Sayfa ${page}`}
              draggable={false}
              className="max-h-[72vh] w-full select-none object-contain"
            />
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <button onClick={() => go(-1)} disabled={page === 1} className="btn-ghost h-10 justify-self-start text-sm">
              ← Önceki
            </button>
            <span className="rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-black text-accent-dark">
              {pageLabel}
            </span>
            <button
              onClick={() => go(1)}
              disabled={page === total}
              className="btn-ghost h-10 justify-self-end text-sm"
            >
              Sonraki →
            </button>
          </div>
        </div>
      )}

      {/* Tam ekran katmanı */}
      <div
        ref={fsContainerRef}
        className={`fixed inset-0 z-[9999] bg-white ${isFullscreen ? 'flex' : 'hidden'} items-center justify-center`}
      >
        <div ref={fsSwipeRef} className="grid h-full w-full touch-pan-y place-items-center">
          {current && (
            <img
              src={current.image_url}
              alt={`${data.title} - Sayfa ${page}`}
              draggable={false}
              className="h-full w-full select-none object-contain"
            />
          )}
        </div>
        <button
          onClick={exit}
          className="fixed bottom-3 right-3 z-[10010] grid h-12 w-12 place-items-center rounded-full border border-accent/20 bg-white/90 text-2xl font-black text-accent-dark shadow"
          aria-label="Tam ekranı kapat"
        >
          ×
        </button>
        <div className="fixed bottom-3 left-1/2 z-[10010] -translate-x-1/2 rounded-full border border-accent/20 bg-white/85 px-4 py-1.5 text-sm font-black text-accent-dark">
          {pageLabel}
        </div>
      </div>
    </div>
  );
}
