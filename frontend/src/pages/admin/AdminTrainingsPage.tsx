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
import {
  IconPlus,
  IconUpload,
  IconTrash,
  IconPause,
  IconPlay,
  IconArrowLeft,
  IconArrowRight,
  IconImage,
  IconLayers,
} from '../../components/icons';

export function AdminTrainingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TrainingSummary | null>(null);
  const [dragOver, setDragOver] = useState(false);

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
      toast('Eğitim oluşturuldu. Şimdi PNG sayfaları yükle.', 'success');
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
      toast('Durum güncellendi.', 'success');
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

  const handleFiles = (files: File[]) => {
    if (!files.length || !selectedId) return;
    const pngs = files.filter((f) => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png'));
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-content">Eğitim Yönetimi</h1>
        <p className="mt-1 text-sm text-subtle">Eğitim oluştur, PNG sayfaları yükle ve düzenle.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* Sol panel */}
        <div className="space-y-4">
          <form onSubmit={onCreate} className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-content">Yeni eğitim</h2>
            <div className="grid gap-2.5">
              <input
                className="field"
                placeholder="Başlık (ör. Fatura İşleme)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <input
                className="field"
                placeholder="Alt başlık (opsiyonel)"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
              />
              <button type="submit" disabled={createMut.isPending} className="btn-primary h-9">
                <IconPlus width={16} height={16} />
                {createMut.isPending ? 'Oluşturuluyor…' : 'Oluştur'}
              </button>
            </div>
          </form>

          <div className="card overflow-hidden">
            <div className="border-b border-line px-4 py-3 text-sm font-semibold text-content">
              Eğitimler
            </div>
            {trainingsQ.isLoading ? (
              <div className="grid place-items-center p-8">
                <Spinner />
              </div>
            ) : (trainingsQ.data?.length ?? 0) === 0 ? (
              <div className="p-6 text-center text-sm text-subtle">Henüz eğitim yok.</div>
            ) : (
              <ul>
                {trainingsQ.data?.map((t) => (
                  <li
                    key={t.id}
                    className={`flex items-center gap-2 border-b border-line px-3 py-2.5 last:border-0 ${
                      selectedId === t.id ? 'bg-brand-500/8' : 'hover:bg-elevated/60'
                    }`}
                  >
                    <button onClick={() => setSelectedId(t.id)} className="min-w-0 flex-1 text-left">
                      <span className={`block truncate text-sm font-medium ${selectedId === t.id ? 'text-brand-600 dark:text-brand-400' : 'text-content'}`}>
                        {t.title}
                      </span>
                      <span className="text-xs text-faint">
                        {t.pageCount} sayfa{t.active ? '' : ' · pasif'}
                      </span>
                    </button>
                    <button
                      onClick={() => toggleActiveMut.mutate(t)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-subtle hover:bg-surface hover:text-content"
                      title={t.active ? 'Pasifleştir' : 'Aktifleştir'}
                    >
                      {t.active ? <IconPause width={14} height={14} /> : <IconPlay width={14} height={14} />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-rose-500/10"
                      title="Sil"
                    >
                      <IconTrash width={14} height={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sağ panel */}
        <div className="card p-5">
          {!selectedId ? (
            <div className="grid h-full min-h-[320px] place-items-center px-6 text-center">
              <div className="flex flex-col items-center gap-2 text-subtle">
                <IconLayers width={28} height={28} className="text-faint" />
                <p className="text-sm">Düzenlemek için bir eğitim seç veya yeni bir tane oluştur.</p>
              </div>
            </div>
          ) : detailQ.isLoading ? (
            <div className="grid place-items-center p-12">
              <Spinner label="Yükleniyor…" />
            </div>
          ) : detailQ.data ? (
            <div>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-content">{detailQ.data.title}</h2>
                  {detailQ.data.subtitle && (
                    <p className="truncate text-sm text-subtle">{detailQ.data.subtitle}</p>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadMut.isPending}
                  className="btn-primary h-9"
                >
                  <IconUpload width={16} height={16} />
                  {uploadMut.isPending ? 'Yükleniyor…' : 'PNG yükle'}
                </button>
              </div>

              {detailQ.data.pages.length === 0 ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFiles(Array.from(e.dataTransfer.files));
                  }}
                  className={`grid cursor-pointer place-items-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
                    dragOver ? 'border-brand-500 bg-brand-500/5' : 'border-line hover:border-brand-500/40'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-subtle">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-elevated text-faint">
                      <IconImage width={22} height={22} />
                    </span>
                    <p className="text-sm font-medium text-content">PNG sayfaları buraya sürükle</p>
                    <p className="text-xs">ya da seçmek için tıkla · çoklu seçim olur</p>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFiles(Array.from(e.dataTransfer.files));
                  }}
                  className={`grid grid-cols-2 gap-3 rounded-xl sm:grid-cols-3 md:grid-cols-4 ${
                    dragOver ? 'ring-2 ring-brand-500/40' : ''
                  }`}
                >
                  {detailQ.data.pages.map((p, i) => (
                    <div key={p.id} className="overflow-hidden rounded-xl border border-line bg-elevated">
                      <div className="relative aspect-[4/3] bg-canvas">
                        <img src={p.image_url} alt={`Sayfa ${p.page_number}`} className="h-full w-full object-contain" />
                        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-white">
                          {p.page_number}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => movePage(i, -1)}
                            disabled={i === 0 || reorderMut.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-subtle hover:bg-surface hover:text-content disabled:opacity-30"
                            title="Sola al"
                          >
                            <IconArrowLeft width={14} height={14} />
                          </button>
                          <button
                            onClick={() => movePage(i, 1)}
                            disabled={i === detailQ.data!.pages.length - 1 || reorderMut.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-subtle hover:bg-surface hover:text-content disabled:opacity-30"
                            title="Sağa al"
                          >
                            <IconArrowRight width={14} height={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => deletePageMut.mutate(p.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-rose-500/10"
                          title="Sayfayı sil"
                        >
                          <IconTrash width={14} height={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eğitim silinsin mi?"
        message={`"${deleteTarget?.title}" ve tüm sayfaları silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        onConfirm={() => deleteTarget && deleteTrainingMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
