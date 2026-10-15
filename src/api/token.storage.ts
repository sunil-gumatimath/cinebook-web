import type { UserRole } from '@/types/api'

const TOKEN_STORAGE_KEY = 'mtbs.auth'
const USERNAME_CACHE_PREFIX = 'mtbs.username.'

export interface StoredAuth {
  token: string
  userId: string
  email: string
  username: string
  role: UserRole
}

export interface JwtClaims {
  /** Primary user id claim; `id`/`uid` are accepted as fallbacks. */
  userId?: string | number
  id?: string | number
  uid?: string | number
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

export function isTokenExpired(token: string): boolean {
  const claims = decodeJwtClaims(token)
  if (!claims.exp) return false
  // Add a 5 second clock skew margin
  return claims.exp * 1000 <= Date.now() + 5000
}

export function getTokenRemainingMs(token: string): number {
  const claims = decodeJwtClaims(token)
  if (!claims.exp) return Number.POSITIVE_INFINITY
  return Math.max(0, claims.exp * 1000 - Date.now())
}

function getStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage
    }
  } catch {
    // ignore
  }
  return null
}

/** Cache username by email or userId to persist real usernames across logins. */
export function cacheUsername(identifier: string, username: string): void {
  if (!identifier || !username) return
  try {
    getStorage()?.setItem(`${USERNAME_CACHE_PREFIX}${identifier.toLowerCase()}`, username)
  } catch {
    // localStorage might fail in private browsing
  }
}

export function getCachedUsername(identifier: string): string | null {
  if (!identifier) return null
  try {
    return getStorage()?.getItem(`${USERNAME_CACHE_PREFIX}${identifier.toLowerCase()}`) ?? null
  } catch {
    return null
  }
}

/** Read the persisted auth session, if any. Automatically drops expired sessions. */
export function readStoredAuth(): StoredAuth | null {
  const storage = getStorage()
  if (!storage) return null
  const raw = storage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as StoredAuth
    if (!session.token || isTokenExpired(session.token)) {
      clearStoredAuth()
      return null
    }
    return session
  } catch {
    clearStoredAuth()
    return null
  }
}

export function writeStoredAuth(value: StoredAuth | null): void {
  if (value === null) {
    clearStoredAuth()
    return
  }
  try {
    getStorage()?.setItem(TOKEN_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // ignore storage quota errors
  }
}

export function clearStoredAuth(): void {
  try {
    getStorage()?.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // ignore
  }
}