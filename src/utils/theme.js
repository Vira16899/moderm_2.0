/** Keep the root and body synchronized across workspace and authentication routes. */
export function applyTheme(value, { storage = globalThis.localStorage, document = globalThis.document } = {}) {
  const theme = value === 'dark' ? 'dark' : 'light';
  storage?.setItem('app_theme', theme);
  document?.documentElement.classList.toggle('dark', theme === 'dark');
  document?.body.classList.toggle('dark', theme === 'dark');
  return theme;
}
