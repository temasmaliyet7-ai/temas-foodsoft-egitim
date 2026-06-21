import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchUsers,
  createUser,
  updateUser,
  setUserActive,
  deleteUser,
} from '../../api/users';
import { apiErrorMessage } from '../../api/client';
import type { Role, User } from '../../types';
import { Spinner } from '../../components/Spinner';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

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
      toast(v.active ? 'Kullanıcı aktif yapıldı.' : 'Kullanıcı pasif yapıldı.', 'success');
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

  // Admin'leri gizle, filtre/arama uygula (admin.html paritesi)
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
    v ? new Date(v).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-ink">Kullanıcı Yönetimi</h2>
          <p className="text-sm text-muted">Kullanıcıları ekleyebilir, düzenleyebilir veya silebilirsin.</p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setFormOpen(true);
          }}
          className="btn-accent h-11 px-5"
        >
          ＋ Yeni Kullanıcı
        </button>
      </div>

      {formOpen && (
        <form onSubmit={onSubmit} className="card mb-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-accent-dark">
              {form.id ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
            </h3>
            <button type="button" onClick={() => setFormOpen(false)} className="text-2xl text-muted">
              ×
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-extrabold text-ink">Kullanıcı Adı</label>
              <input
                className="input"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="Kullanıcı adı"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-extrabold text-ink">
                Şifre {form.id && <span className="text-xs text-muted">(boşsa değişmez)</span>}
              </label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Şifre"
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-extrabold text-ink">Rol</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              >
                <option value="user">Kullanıcı</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saveMut.isPending} className="btn-accent h-11 px-6">
              {saveMut.isPending ? 'Kaydediliyor...' : '💾 Kaydet'}
            </button>
            <button type="button" onClick={() => setForm(emptyForm)} className="btn-ghost h-11 px-5">
              ↻ Temizle
            </button>
          </div>
        </form>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          className="input max-w-[260px]"
          placeholder="İsim ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input max-w-[160px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">Tümü</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="grid place-items-center p-10">
            <Spinner label="Yükleniyor..." />
          </div>
        ) : error ? (
          <div className="p-6 text-center font-bold text-red-600">{apiErrorMessage(error)}</div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-muted">Kullanıcı bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="bg-accent/5 text-left text-sm text-accent-dark">
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Kullanıcı Adı</th>
                  <th className="p-3.5">Durum</th>
                  <th className="p-3.5">Son Giriş</th>
                  <th className="p-3.5">Güncelleme</th>
                  <th className="p-3.5">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u, i) => (
                  <tr key={u.id} className="border-t border-accent/10 text-sm">
                    <td className="p-3.5 text-muted">{i + 1}</td>
                    <td className="p-3.5 font-bold text-ink">{u.username}</td>
                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-black ${
                          u.active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {u.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted">{fmtDate(u.last_login_at)}</td>
                    <td className="p-3.5 text-muted">{fmtDate(u.updated_at)}</td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => startEdit(u)} className="btn-ghost h-9 px-3 text-xs">
                          ✏️ Düzenle
                        </button>
                        <button
                          onClick={() => toggleMut.mutate({ id: u.id, active: !u.active })}
                          className="btn-ghost h-9 px-3 text-xs"
                        >
                          {u.active ? '⏸ Pasif' : '▶ Aktif'}
                        </button>
                        <button onClick={() => setToDelete(u)} className="btn-danger h-9 px-3 text-xs">
                          🗑️
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
        message={`${toDelete?.username} kullanıcısı tamamen silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
