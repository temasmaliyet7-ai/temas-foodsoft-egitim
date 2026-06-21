import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchTrainings } from '../api/trainings';
import { apiErrorMessage } from '../api/client';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../auth/AuthContext';

export function LibraryPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ['trainings'], queryFn: fetchTrainings });

  return (
    <div className="mx-auto w-full max-w-[920px]">
      <div className="px-2 pb-5">
        <h2 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
          Merhaba {user?.username}, hoş geldiniz! 👋
        </h2>
        <p className="mt-2 text-base font-semibold text-muted">
          Görüntülemek istediğiniz eğitim başlığını seçiniz.
        </p>
      </div>

      {isLoading && (
        <div className="grid place-items-center py-16">
          <Spinner label="Eğitimler yükleniyor..." />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-center font-bold text-red-600">
          {apiErrorMessage(error)}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="card p-10 text-center text-muted">
          Henüz eğitim eklenmemiş.
          {user?.role === 'admin' && (
            <div className="mt-3">
              <Link to="/admin/egitimler" className="btn-accent h-11 px-5">
                + İlk eğitimi oluştur
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.map((t) => (
          <Link
            key={t.id}
            to={`/egitim/${t.id}`}
            className="group flex items-center gap-3 rounded-3xl border border-accent/20 bg-gradient-to-br from-white to-[rgba(235,250,255,.78)] p-4 shadow-card transition hover:-translate-y-0.5 hover:border-accent/40"
          >
            <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-dark text-xl text-white shadow">
              📘
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-black text-accent-dark">{t.title}</span>
              {t.subtitle && (
                <span className="block truncate text-sm font-semibold text-muted">{t.subtitle}</span>
              )}
            </span>
            <span className="flex-none rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-black text-accent-dark">
              {t.pageCount} sf
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
