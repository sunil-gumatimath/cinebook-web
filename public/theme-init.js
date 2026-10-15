/**
 * Applies the persisted (or system) theme before React mounts, avoiding a flash
 * of the wrong color scheme.
 *
 * Served from /public so it stays same-origin and is allowed by the
 * `script-src 'self'` CSP — an inline <script> would be blocked by that policy,
 * which is why the theme is bootstrapped from a file instead.
 *
 * Kept in sync with ThemeProvider defaults in src/main.tsx
 * (attribute="class", defaultTheme="dark", storageKey="theme").
 */
;(function () {
  try {
    var stored = window.localStorage.getItem('theme')
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    // No stored preference falls back to the app default ("dark").
    var isDark =
      stored === 'dark' ? true
      : stored === 'light' ? false
      : stored === 'system' ? prefersDark
      : true

    var root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.style.colorScheme = isDark ? 'dark' : 'light'
  } catch {
    // Storage/matchMedia unavailable — leave the markup default in place.
  }
})()
