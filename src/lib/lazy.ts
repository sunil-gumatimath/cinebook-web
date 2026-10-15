import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'

const CHUNK_RELOAD_KEY = 'mtbs.chunk-reload'

/**
 * `React.lazy`, hardened for production.
 *
 * Vite emits content-hashed chunk filenames. After a redeploy an already-open tab
 * still holds the previous `index.html`, so a route change requests a chunk that
 * no longer exists and the dynamic import rejects. Instead of unmounting the app
 * (blank screen), reload once to fetch the new manifest. The session flag stops
 * an infinite reload loop if the network is genuinely broken — the error is then
 * rethrown so the nearest error boundary can render it.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await factory()
      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
      return module
    } catch (error) {
      const alreadyReloaded =
        typeof sessionStorage !== 'undefined' && sessionStorage.getItem(CHUNK_RELOAD_KEY) !== null

      if (!alreadyReloaded && typeof window !== 'undefined') {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
        window.location.reload()
        // The page is unloading; never resolve so React does not render a stale tree.
        return await new Promise<{ default: T }>(() => {})
      }

      throw error
    }
  })
}
