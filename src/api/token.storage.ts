const TOKEN_STORAGE_KEY = 'mtbs.auth'

interface StoredAuth {
  token: string
  userId: string
  email: string
  username: string
  role: string
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
