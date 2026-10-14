/** Runtime configuration. Override in `.env.local` if your backend port differs. */
export const config = {
  /** Vite dev server proxies /api -> backend (see vite.config.ts). */
  apiBaseUrl: (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api',
  appName: 'CineBook',
} as const
