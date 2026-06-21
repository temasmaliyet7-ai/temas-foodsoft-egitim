import { useTheme } from '../theme/ThemeContext';
import { IconSun, IconMoon } from './icons';

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-subtle transition-colors hover:bg-elevated hover:text-content"
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      title={isDark ? 'Açık tema' : 'Koyu tema'}
    >
      {isDark ? <IconSun width={17} height={17} /> : <IconMoon width={17} height={17} />}
    </button>
  );
}
