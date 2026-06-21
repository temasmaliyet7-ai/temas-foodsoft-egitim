import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, createUser, updateUser, setUserActive, deleteUser } from '../../api/users';
import { apiErrorMessage } from '../../api/client';
import type { Role, User } from '../../types';
import { Spinner } from '../../components/Spinner';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconPause,
  IconPlay,
  IconX,
  IconUsers,
} from '../../components/icons';

const emptyForm = { id: '', username: '', password: '', role: 'user' as Role };

export function AdminUsersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive'>('all');
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const { data, isLoading, error } = useQuery({ queryKey: ['users'], queryFn: () => fetchUsers() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (form.id) {
        await updateUser(form.id, {
          username: form.username,
          password: form.password || undefined,
          role: form.role,
        });
      } else {
        await createUser({ username: form.username, password: form.password, role: form.role });
      }
    },
    onSuccess: () => {
      toast(form.id ? 'Kullanıcı güncellendi.' : 'Kullanıcı eklendi.', 'success');
      setForm(emptyForm);
      setFormOpen(false);
      invalidate();
    },
    onError: (e) => toast(apiErrorMessage(e), 'error'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setUserActive(id, active),
    onSuccess: (_d, v) => {
      toast(v.active ? 'Kullanıcı aktifleştirildi.' : 'Kullanıcı pasifleştirildi.', 'success');
      invalidate();
    },
    onError: (e) => toast(apiErrorMessage(e), 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast('Kullanıcı silindi.', 'success');
      setToDelete(null);
      invalidate();
    },
    onError: (e) => {
      toast(apiErrorMessage(e), 'error');
      setToDelete(null);
    },
  });

  const visible = useMemo(() => {
    const list = (data ?? []).filter((u) => u.role !== 'admin');
    const s = search.trim().toLocaleLowerCase('tr');
    return list.filter((u) => {
      if (statusFilter === 'active' && !u.active) return false;
      if (statusFilter === 'passive' && u.active) return false;
      if (s && !u.username.toLocaleLowerCase('tr').includes(s)) return false;
      return true;
    });
  }, [data, search, statusFilter]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) return toast('Kullanıcı adı boş olamaz.', 'error');
    if (!form.id && !form.password.trim()) return toast('Yeni kullanıcı için şifre zorunlu.', 'error');
    saveMut.mutate();
  };

  const startEdit = (u: User) => {
    setForm({ id: u.id, username: u.username, password: '', role: u.role });
    setFormOpen(true);
  };

  const fmtDate = (v: string | null) =>
    v ? new Date(v).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content">Kullanıcılar</h1>
          <p className="mt-1 text-sm text-subtle">Kullanıcı hesaplarını yönetin.</p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setFormOpen(true);
          }}
          className="btn-primary h-9"
        >
          <IconPlus width={16} height={16} />
          Yeni kullanıcı
        </button>
      </div>

      {/* Form (açılır panel) */}
      {formOpen && (
        <div className="card mb-5 animate-slide-up p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-content">{form.id ? 'Kullanıcı düzenle' : 'Yeni kullanıcı'}</h2>
            <button onClick={() => setFormOpen(false)} className="text-faint hover:text-content">
              <IconX width={18} height={18} />
            </button>
          </div>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Kullanıcı adı</label>
              <input
                className="field"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="kullanıcı adı"
              />
            </div>
            <div>
              <label className="label">
                Şifre {form.id && <span className="font-normal text-faint">(boşsa değişmez)</span>}
              </label>
              <input
                className="field"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">Rol</label>
              <select
                className="field"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              >
                <option value="user">Kullanıcı</option>
                <option value="admin">Yönetici</option>
              </select>
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <button type="submit" disabled={saveMut.isPending} className="btn-primary h-9">
                {saveMut.isPending ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
              <button type="button" onClick={() => setForm(emptyForm)} className="btn-ghost h-9">
                Temizle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Arama + filtre */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
            <IconSearch width={15} height={15} />
          </span>
          <input
            className="field w-56 pl-9"
            placeholder="İsim ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field w-36"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
        </select>
      </div>

      {/* Tablo */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="grid place-items-center p-12">
            <Spinner label="Yükleniyor…" />
          </div>
        ) : error ? (
          <div className="p-6 text-sm font-medium text-rose-600 dark:text-rose-400">{apiErrorMessage(error)}</div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center text-subtle">
            <IconUsers width={28} height={28} className="text-faint" />
            <p className="text-sm">Kullanıcı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-faint">
                  <th className="px-5 py-3">Kullanıcı</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3">Son giriş</th>
                  <th className="px-5 py-3">Güncelleme</th>
                  <th className="px-5 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0 hover:bg-elevated/50">
                    <td className="px-5 py-3 font-medium text-content">{u.username}</td>
                    <td className="px-5 py-3">
                      {u.active ? (
                        <span className="badge bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      ) : (
                        <span className="badge bg-zinc-500/12 text-subtle">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                          Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-subtle">{fmtDate(u.last_login_at)}</td>
                    <td className="px-5 py-3 text-subtle">{fmtDate(u.updated_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(u)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle hover:bg-surface hover:text-content"
                          title="Düzenle"
                        >
                          <IconEdit width={16} height={16} />
                        </button>
                        <button
                          onClick={() => toggleMut.mutate({ id: u.id, active: !u.active })}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle hover:bg-surface hover:text-content"
                          title={u.active ? 'Pasifleştir' : 'Aktifleştir'}
                        >
                          {u.active ? <IconPause width={15} height={15} /> : <IconPlay width={15} height={15} />}
                        </button>
                        <button
                          onClick={() => setToDelete(u)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                          title="Sil"
                        >
                          <IconTrash width={16} height={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Kullanıcı silinsin mi?"
        message={`"${toDelete?.username}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
