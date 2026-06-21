import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchTrainings } from '../api/trainings';
import { apiErrorMessage } from '../api/client';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../auth/AuthContext';
import { IconBook, IconChevronRight, IconPlus, IconLayers } from '../components/icons';

export function LibraryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data, isLoading, error } = useQuery({ queryKey: ['trainings'], queryFn: fetchTrainings });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-content">Eğitim Kütüphanesi</h1>
        <p className="mt-1 text-sm text-subtle">
          {data ? `${data.length} eğitim` : 'Eğitimlerinizi görüntüleyin'}
        </p>
      </div>

      {isLoading && (
        <div className="grid place-items-center py-20">
          <Spinner label="Yükleniyor…" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm font-medium text-rose-600 dark:text-rose-400">
          {apiErrorMessage(error)}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-elevated text-faint">
            <IconLayers width={22} height={22} />
          </span>
          <div>
            <p className="font-semibold text-content">Henüz eğitim yok</p>
            <p className="mt-0.5 text-sm text-subtle">
              {isAdmin ? 'İlk eğitimini oluşturarak başla.' : 'Yöneticiniz eğitim eklediğinde burada görünecek.'}
            </p>
          </div>
          {isAdmin && (
            <Link to="/admin/egitimler" className="btn-primary mt-1 h-9">
              <IconPlus width={16} height={16} />
              Eğitim oluştur
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((t) => (
          <Link
            key={t.id}
            to={`/egitim/${t.id}`}
            className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all hover:border-brand-500/40 hover:shadow-md"
          >
            <div className="mb-6 flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <IconBook width={20} height={20} />
              </span>
              <span className="badge bg-elevated text-subtle">{t.pageCount} sayfa</span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-content">{t.title}</h3>
                {t.subtitle && <p className="mt-0.5 line-clamp-1 text-sm text-subtle">{t.subtitle}</p>}
              </div>
              <span className="flex-none text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500">
                <IconChevronRight width={18} height={18} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
