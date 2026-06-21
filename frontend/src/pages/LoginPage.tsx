import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { IconUser, IconLock, IconEye, IconEyeOff, IconAlert } from '../components/icons';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Kullanıcı adı ve şifre giriniz.');
      return;
    }
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm animate-slide-up">
        {/* Marka */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 shadow-md">
            <img src="/assets/foodsoft-clean.png" alt="" className="h-7 w-5 object-contain brightness-0 invert" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-content">Foodsoft Eğitim</h1>
          <p className="mt-1 text-sm text-subtle">Devam etmek için giriş yapın</p>
        </div>

        <form onSubmit={onSubmit} className="card p-6">
          <div className="mb-4">
            <label htmlFor="u" className="label">
              Kullanıcı adı
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
                <IconUser width={16} height={16} />
              </span>
              <input
                id="u"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kullanıcı adınız"
                className="field pl-9"
              />
            </div>
          </div>

          <div className="mb-1">
            <label htmlFor="p" className="label">
              Şifre
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
                <IconLock width={16} height={16} />
              </span>
              <input
                id="p"
                name="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field px-9"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-content"
                aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPass ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400">
              <IconAlert width={15} height={15} className="flex-none" />
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary mt-5 h-10 w-full">
            {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-faint">Temaş Catering · Eğitim Platformu</p>
      </div>
    </div>
  );
}
