const TOKEN_STORAGE_KEY = 'mtbs.auth'

interface StoredAuth {
  token: string
  userId: string
  email: string
  username: string
  role: string
}

export interface JwtClaims {
  userId?: string
  role?: string
  sub?: string
  email?: string
  exp?: number
  iat?: number
}

/** Best-effort decoding of the JWT payload (no signature check — used only for UI state). */
export function decodeJwtClaims(token: string): JwtClaims {
  const segments = token.split('.')
  const payload = segments[1]
  if (segments.length < 2 || payload === undefined) return {}
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice(0, (4 - (payload.length % 4)) % 4)
  try {
    return JSON.parse(atob(normalized)) as JwtClaims
  } catch {
    return {}
  }
}

/** Read the persisted auth session, if any. */
export function readStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAuth
  } catch {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    return null
  }
}

export function writeStoredAuth(value: StoredAuth | null): void {
  if (value === null) {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    return
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(value))
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}