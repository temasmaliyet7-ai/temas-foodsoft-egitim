import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

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
    <div className="grid min-h-screen place-items-center p-5">
      <form
        onSubmit={onSubmit}
        className="card w-full max-w-[420px] overflow-hidden p-7 sm:p-8"
        autoComplete="on"
      >
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center overflow-hidden rounded-3xl bg-[rgb(54,195,248)] shadow-lg">
          <img src="/assets/foodsoft-clean.png" alt="Foodsoft" className="h-14 w-10 object-contain" />
        </div>
        <h1 className="text-center text-3xl font-black tracking-tight text-[#0f2631]">
          Foodsoft Eğitim Programı
        </h1>
        <p className="mx-auto mt-2.5 max-w-[300px] text-center text-sm font-bold text-[#0f2631]/70">
          Eğitim içeriklerine erişmek için kullanıcı bilgilerinizi giriniz.
        </p>

        <div className="mt-6 grid gap-2">
          <label htmlFor="u" className="pl-1 text-xs font-extrabold text-[#0f2631]/70">
            Kullanıcı adı
          </label>
          <div className="flex h-[54px] items-center gap-2.5 rounded-2xl border border-accent/20 bg-white/75 px-3.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
            <span className="text-accent-dark">👤</span>
            <input
              id="u"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              className="w-full bg-transparent font-extrabold text-ink outline-none"
            />
          </div>
        </div>

        <div className="mt-3.5 grid gap-2">
          <label htmlFor="p" className="pl-1 text-xs font-extrabold text-[#0f2631]/70">
            Şifre
          </label>
          <div className="flex h-[54px] items-center gap-2.5 rounded-2xl border border-accent/20 bg-white/75 px-3.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
            <span className="text-accent-dark">🔒</span>
            <input
              id="p"
              name="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              className="w-full bg-transparent font-extrabold text-ink outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="text-accent-dark/80"
              aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-accent mt-5 h-14 w-full text-base">
          {busy ? 'Kontrol ediliyor...' : 'Giriş Yap'}
        </button>

        {error && <p className="mt-3 text-center text-sm font-bold text-red-600">{error}</p>}
        <p className="mt-2.5 text-center text-xs font-bold text-[#0f2631]/50">
          Temaş Catering · Eğitim erişim ekranı
        </p>
      </form>
    </div>
  );
}
