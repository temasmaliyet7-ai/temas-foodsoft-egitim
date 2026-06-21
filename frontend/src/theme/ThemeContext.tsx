import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeState | undefined>(undefined);

function resolveDark(mode: ThemeMode): boolean {
  if (mode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
  return mode === 'dark';
}

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return 'system';
  });
  const [isDark, setIsDark] = useState<boolean>(() => resolveDark(mode));

  // Mod değişince uygula + kalıcı yap
  useEffect(() => {
    const dark = resolveDark(mode);
    setIsDark(dark);
    applyDark(dark);
    if (mode === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', mode);
  }, [mode]);

  // Sistem teması değişirse (yalnızca 'system' modunda) takip et
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      setIsDark(mq.matches);
      applyDark(mq.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  // Düğme: mevcut görünümün tersine sabitle
  const toggle = useCallback(() => setModeState(resolveDark(mode) ? 'light' : 'dark'), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme, ThemeProvider içinde kullanılmalı.');
  return ctx;
}
