// Theme hook — dark primary, light alt. Persists to localStorage; reflects on
// <html data-theme>. Defaults to dark (the designed-for-first surface).
import { useCallback, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const KEY = 'rlr-theme';

function initial(): Theme {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  }
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return { theme, toggle };
}
