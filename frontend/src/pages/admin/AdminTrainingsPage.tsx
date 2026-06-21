import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchTrainings,
  fetchTraining,
  createTraining,
  updateTraining,
  deleteTraining,
  uploadPages,
  reorderPages,
  deletePage,
} from '../../api/trainings';
import { apiErrorMessage } from '../../api/client';
import type { TrainingSummary } from '../../types';
import { Spinner } from '../../components/Spinner';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export function AdminTrainingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TrainingSummary | null>(null);

  const trainingsQ = useQuery({ queryKey: ['trainings'], queryFn: fetchTrainings });
  const detailQ = useQuery({
    queryKey: ['training', selectedId],
    queryFn: () => fetchTraining(selectedId!),
    enabled: !!selectedId,
  });

  const refreshLists = () => {
    qc.invalidateQueries({ queryKey: ['trainings'] });
    if (selectedId) qc.invalidateQueries({ queryKey: ['training', selectedId] });
  };

  const createMut = useMutation({
    mutationFn: () => createTraining({ title: newTitle, subtitle: newSubtitle || undefined }),
    onSuccess: (t) => {
      toast('Eğitim oluşturuldu. Şimdi PNG sayfaları yükleyebilirsin.', 'success');
      setNewTitle('');
      setNewSubtitle('');
      setSelectedId(t.id);
      refreshLists();
    },
    onError: (e) => toast(apiErrorMessage(e), 'error'),
  });

  const uploadMut = useMutation({
    mutationFn: (files: File[]) => uploadPages(selectedId!, files),
    onSuccess: (pages) => {
      toast(`${pages.length} sayfa yüklendi.`, 'success');
      refreshLists();
    },
    onError: (e) => toast(apiErrorMessage(e), 'error'),
  });

  const reorderMut = useMutation({
    mutationFn: (order: string[]) => reorderPages(selectedId!, order),
    onSuccess: () => refreshLists(),
    onError: (e) => toast(apiErrorMessage(e), 'error'),
  });

  const deletePageMut = useMutation({
    mutationFn: (pageId: string) => deletePage(selectedId!, pageId),
    onSuccess: () => {
      toast('Sayfa silindi.', 'success');
      refreshLists();
    },
    onError: (e) => toast(apiErrorMessage(e), 'error'),
  });

  const toggleActiveMut = useMutation({
    mutationFn: (t: TrainingSummary) => updateTraining(t.id, { active: !t.active }),
    onSuccess: () => {
      toast('Eğitim durumu güncellendi.', 'success');
      refreshLists();
    },
    onError: (e) => toast(apiErrorMessage(e), 'error'),
  });

  const deleteTrainingMut = useMutation({
    mutationFn: (id: string) => deleteTraining(id),
    onSuccess: (_d, id) => {
      toast('Eğitim silindi.', 'success');
      if (selectedId === id) setSelectedId(null);
      setDeleteTarget(null);
      refreshLists();
    },
    onError: (e) => {
      toast(apiErrorMessage(e), 'error');
      setDeleteTarget(null);
    },
  });

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return toast('Başlık gerekli.', 'error');
    createMut.mutate();
  };

  const onFilesPicked = (files: FileList | null) => {
    if (!files || !files.length || !selectedId) return;
    const pngs = Array.from(files).filter((f) => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png'));
    if (!pngs.length) return toast('Lütfen PNG dosyası seçin.', 'error');
    uploadMut.mutate(pngs);
    if (fileRef.current) fileRef.current.value = '';
  };

  const movePage = (index: number, dir: -1 | 1) => {
    const pages = detailQ.data?.pages ?? [];
    const target = index + dir;
    if (target < 0 || target >= pages.length) return;
    const order = pages.map((p) => p.id);
    [order[index], order[target]] = [order[target], order[index]];
    reorderMut.mutate(order);
  };

  return (
    <div className="mx-auto grid w-full max-w-[1200px] gap-4 lg:grid-cols-[360px_1fr]">
      {/* Sol: eğitim listesi + yeni oluştur */}
      <div className="space-y-4">
        <form onSubmit={onCreate} className="card p-5">
          <h3 className="mb-3 text-lg font-black text-accent-dark">＋ Yeni Eğitim Oluştur</h3>
          <div className="grid gap-3">
            <input
              className="input"
              placeholder="Başlık (ör. Fatura İşleme)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input
              className="input"
              placeholder="Alt başlık (opsiyonel)"
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
            />
            <button type="submit" disabled={createMut.isPending} className="btn-accent h-11">
              {createMut.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>

        <div className="card overflow-hidden">
          <div className="border-b border-accent/15 p-4 font-black text-accent-dark">Eğitimler</div>
          {trainingsQ.isLoading ? (
            <div className="grid place-items-center p-8">
              <Spinner />
            </div>
          ) : (trainingsQ.data?.length ?? 0) === 0 ? (
            <div className="p-6 text-center text-muted">Henüz eğitim yok.</div>
          ) : (
            <ul className="divide-y divide-accent/10">
              {trainingsQ.data?.map((t) => (
                <li
                  key={t.id}
                  className={`flex items-center gap-2 p-3 ${selectedId === t.id ? 'bg-accent/5' : ''}`}
                >
                  <button
                    onClick={() => setSelectedId(t.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate font-bold text-ink">{t.title}</span>
                    <span className="text-xs text-muted">
                      {t.pageCount} sayfa {t.active ? '' : '· pasif'}
                    </span>
                  </button>
                  <button
                    onClick={() => toggleActiveMut.mutate(t)}
                    title={t.active ? 'Pasif yap' : 'Aktif yap'}
                    className="btn-ghost h-8 px-2 text-xs"
                  >
                    {t.active ? '⏸' : '▶'}
                  </button>
                  <button onClick={() => setDeleteTarget(t)} className="btn-danger h-8 px-2 text-xs">
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sağ: seçili eğitimin sayfaları */}
      <div className="card p-5">
        {!selectedId ? (
          <div className="grid h-full min-h-[300px] place-items-center text-center text-muted">
            Düzenlemek için soldan bir eğitim seç ya da yeni bir eğitim oluştur.
          </div>
        ) : detailQ.isLoading ? (
          <div className="grid place-items-center p-10">
            <Spinner label="Yükleniyor..." />
          </div>
        ) : detailQ.data ? (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-ink">{detailQ.data.title}</h3>
                {detailQ.data.subtitle && <p className="text-sm text-muted">{detailQ.data.subtitle}</p>}
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png"
                  multiple
                  hidden
                  onChange={(e) => onFilesPicked(e.target.files)}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadMut.isPending}
                  className="btn-accent h-11 px-5"
                >
                  {uploadMut.isPending ? 'Yükleniyor...' : '⬆ PNG Sayfa Yükle'}
                </button>
              </div>
            </div>

            {detailQ.data.pages.length === 0 ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-accent/30 bg-accent/5 p-12 text-center text-muted hover:bg-accent/10"
              >
                <div>
                  <div className="text-4xl">🖼️</div>
                  <p className="mt-2 font-bold text-accent-dark">PNG sayfaları yüklemek için tıkla</p>
                  <p className="text-sm">Birden fazla dosya seçebilirsin. Sıralama yükleme sırasına göre olur.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {detailQ.data.pages.map((p, i) => (
                  <div key={p.id} className="overflow-hidden rounded-2xl border border-accent/15 bg-white">
                    <div className="relative aspect-[4/3] bg-slate-50">
                      <img src={p.image_url} alt={`Sayfa ${p.page_number}`} className="h-full w-full object-contain" />
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-accent-dark/85 px-2 py-0.5 text-xs font-black text-white">
                        {p.page_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 p-1.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => movePage(i, -1)}
                          disabled={i === 0 || reorderMut.isPending}
                          className="btn-ghost h-8 w-8 p-0 text-xs"
                          title="Yukarı"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => movePage(i, 1)}
                          disabled={i === detailQ.data!.pages.length - 1 || reorderMut.isPending}
                          className="btn-ghost h-8 w-8 p-0 text-xs"
                          title="Aşağı"
                        >
                          →
                        </button>
                      </div>
                      <button
                        onClick={() => deletePageMut.mutate(p.id)}
                        className="btn-danger h-8 w-8 p-0 text-xs"
                        title="Sayfayı sil"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eğitim silinsin mi?"
        message={`"${deleteTarget?.title}" eğitimi ve tüm sayfaları silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        onConfirm={() => deleteTarget && deleteTrainingMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
