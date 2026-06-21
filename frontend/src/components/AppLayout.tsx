import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { IconBook, IconLayers, IconUsers, IconLogout, IconMenu, IconX, IconUser } from './icons';

const links = (isAdmin: boolean) => [
  { to: '/', label: 'Kütüphane', icon: IconBook, end: true },
  ...(isAdmin
    ? [
        { to: '/admin/egitimler', label: 'Eğitim Yönetimi', icon: IconLayers, end: false },
        { to: '/admin/kullanicilar', label: 'Kullanıcılar', icon: IconUsers, end: false },
      ]
    : []),
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-brand-600">
        <img src="/assets/foodsoft-clean.png" alt="" className="h-5 w-3.5 object-contain brightness-0 invert" />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-content">Foodsoft</span>
    </Link>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
        : 'text-subtle hover:bg-elevated hover:text-content',
    ].join(' ');

  return (
    <div className="min-h-screen">
      {/* Üst bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Brand />
            <nav className="hidden items-center gap-1 md:flex">
              {links(isAdmin).map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
                  <l.icon width={16} height={16} />
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenu((o) => !o)}
                className="flex items-center gap-2 rounded-lg border border-line bg-surface py-1.5 pl-1.5 pr-2.5 text-sm font-medium text-content transition-colors hover:bg-elevated"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/12 text-brand-600 dark:text-brand-400">
                  <IconUser width={14} height={14} />
                </span>
                <span className="hidden sm:inline">{user?.username}</span>
              </button>
              {userMenu && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-52 animate-scale-in rounded-xl border border-line bg-elevated p-1.5 shadow-pop">
                  <div className="px-2.5 py-2">
                    <p className="text-sm font-semibold text-content">{user?.username}</p>
                    <p className="text-xs text-faint">{isAdmin ? 'Yönetici' : 'Kullanıcı'}</p>
                  </div>
                  <div className="my-1 h-px bg-line" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-subtle transition-colors hover:bg-surface hover:text-content"
                  >
                    <IconLogout width={16} height={16} />
                    Oturumu kapat
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-subtle md:hidden"
              aria-label="Menü"
            >
              {mobileOpen ? <IconX width={18} height={18} /> : <IconMenu width={18} height={18} />}
            </button>
          </div>
        </div>

        {/* Mobil menü */}
        {mobileOpen && (
          <nav className="border-t border-line px-4 py-3 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {links(isAdmin).map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={navClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <l.icon width={16} height={16} />
                  {l.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
