import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-2xl px-4 py-2.5 text-sm font-extrabold transition',
    isActive
      ? 'bg-gradient-to-br from-accent/20 to-white text-accent-dark border border-accent/40'
      : 'text-muted hover:bg-accent/10 hover:text-accent-dark border border-transparent',
  ].join(' ');

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] p-3 sm:p-4">
      <header className="sticky top-2 z-30 mb-4 flex items-center justify-between gap-3 rounded-3xl border border-accent/20 bg-white/85 px-4 py-3 shadow-soft backdrop-blur">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-[rgb(54,195,248)]">
              <img src="/assets/foodsoft-clean.png" alt="Foodsoft" className="h-7 w-5 object-contain" />
            </span>
            <span className="hidden text-lg font-black tracking-tight text-accent-dark sm:block">
              Foodsoft Eğitim
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            📖 Kütüphanem
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/admin/egitimler" className={navLinkClass}>
                🗂️ Eğitim Yönetimi
              </NavLink>
              <NavLink to="/admin/kullanicilar" className={navLinkClass}>
                👥 Kullanıcılar
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-accent/10 px-3 py-1.5 text-sm font-extrabold text-accent-dark sm:inline-flex">
            👤 {user?.username}
            {isAdmin && <span className="ml-1 text-accent">• admin</span>}
          </span>
          <button onClick={handleLogout} className="btn-ghost h-10">
            Çıkış
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-2xl border border-accent/25 bg-white/70 text-accent-dark md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menü"
          >
            ☰
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="mb-4 grid gap-2 rounded-3xl border border-accent/20 bg-white/90 p-3 md:hidden">
          <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>
            📖 Kütüphanem
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/admin/egitimler" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                🗂️ Eğitim Yönetimi
              </NavLink>
              <NavLink to="/admin/kullanicilar" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                👥 Kullanıcılar
              </NavLink>
            </>
          )}
        </nav>
      )}

      <main>
        <Outlet />
      </main>
    </div>
  );
}
