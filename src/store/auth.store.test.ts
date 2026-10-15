import { describe, expect, it, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'
import { queryClient } from '@/lib/queryClient'
import { getStorageKey, purgeUserData, useRecentStore } from './recent.store'
import { getCachedUsername } from '@/api/token.storage'

// Mock localStorage if in node environment
const storageMap = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size
  },
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  })
}

describe('auth.store user persistence & isolation lifecycle', () => {
  beforeEach(() => {
    localStorage.clear()
    queryClient.clear()
    useRecentStore.getState().clearAll()
    useAuthStore.setState({
      token: null,
      userId: null,
      email: null,
      username: null,
      role: null,
    })
  })

  it('preserves persisted per-user data across logout and isolates across users', () => {
    // 1. User 1 logs in and saves a movie
    useAuthStore.getState().setSession({
      token: 'jwt-user-1',
      userId: 'user-1',
      email: 'user1@gmail.com',
      username: 'alice',
      role: 'ROLE_USER',
    })

    useRecentStore.getState().saveMovie({
      movieId: 'movie-101',
      title: 'Inception',
    })

    queryClient.setQueryData(['test-query'], { data: 'query-cache-123' })

    // Verify User 1's in-memory and on-disk state
    expect(useRecentStore.getState().movies).toHaveLength(1)
    expect(useRecentStore.getState().movies[0]?.title).toBe('Inception')
    expect(queryClient.getQueryData(['test-query'])).toEqual({ data: 'query-cache-123' })
    expect(localStorage.getItem(getStorageKey('user-1'))).toBeTruthy()
    expect(getCachedUsername('user-1')).toBe('alice')
    expect(getCachedUsername('user1@gmail.com')).toBe('alice')

    // 2. User 1 logs out
    useAuthStore.getState().logout()

    // A. After logout: in-memory recent store is empty and query cache is cleared
    expect(useRecentStore.getState().movies).toHaveLength(0)
    expect(queryClient.getQueryData(['test-query'])).toBeUndefined()
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    expect(useAuthStore.getState().userId).toBeNull()

    // B. The persisted per-user data is still on disk
    expect(localStorage.getItem(getStorageKey('user-1'))).toBeTruthy()

    // C. The cached username is still preserved on disk
    expect(getCachedUsername('user-1')).toBe('alice')

    // 3. User 2 logs in: must NOT see User 1's data
    useAuthStore.getState().setSession({
      token: 'jwt-user-2',
      userId: 'user-2',
      email: 'user2@gmail.com',
      username: 'bob',
      role: 'ROLE_USER',
    })

    expect(useRecentStore.getState().userId).toBe('user-2')
    expect(useRecentStore.getState().movies).toHaveLength(0)

    // User 2 logs out
    useAuthStore.getState().logout()

    // 4. User 1 logs back in: restores their persisted data and cached username
    useAuthStore.getState().setSession({
      token: 'jwt-user-1-new',
      userId: 'user-1',
      email: 'user1@gmail.com',
      username: 'alice',
      role: 'ROLE_USER',
    })

    expect(useRecentStore.getState().userId).toBe('user-1')
    expect(useRecentStore.getState().movies).toHaveLength(1)
    expect(useRecentStore.getState().movies[0]?.title).toBe('Inception')
    expect(getCachedUsername('user-1')).toBe('alice')
  })

  it('purges user data on account deletion via purgeUserData', () => {
    // 1. Seed user data
    useAuthStore.getState().setSession({
      token: 'jwt-user-delete',
      userId: 'user-delete',
      email: 'del@gmail.com',
      username: 'to_delete',
      role: 'ROLE_USER',
    })

    useRecentStore.getState().saveMovie({
      movieId: 'm-del',
      title: 'Delete Me',
    })

    expect(localStorage.getItem(getStorageKey('user-delete'))).toBeTruthy()
    expect(getCachedUsername('user-delete')).toBe('to_delete')

    // 2. Call purgeUserData(userId) as done in ProfilePage
    purgeUserData('user-delete')
    useAuthStore.getState().logout()

    // 3. Confirm disk data and username cache are purged
    expect(localStorage.getItem(getStorageKey('user-delete'))).toBeNull()
    expect(getCachedUsername('user-delete')).toBeNull()
  })

  it('clearAll resets userId when clearing state', () => {
    useRecentStore.setState({
      userId: 'some-user',
      movies: [{ movieId: 'm-1', updatedAt: Date.now() }],
      theaters: [],
      screens: [],
    })

    expect(useRecentStore.getState().userId).toBe('some-user')
    useRecentStore.getState().clearAll()

    expect(useRecentStore.getState().userId).toBeNull()
    expect(useRecentStore.getState().movies).toHaveLength(0)
  })
})
