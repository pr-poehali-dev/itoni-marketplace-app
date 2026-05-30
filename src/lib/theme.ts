export type Theme = 'light' | 'dark';

const KEY = 'itoni_theme';

export function getTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme) || 'light';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  localStorage.setItem(KEY, theme);
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
