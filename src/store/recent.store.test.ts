import { beforeEach, describe, expect, it } from 'vitest'

import { getStorageKey, migrateTheaters, useRecentStore } from './recent.store'

// Provide localStorage when running in a Node test environment.
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

const theaterInput = { theaterId: 't-1', name: 'Regal', city: 'Mumbai' }

function theaterSource(id = 't-1') {
  return useRecentStore.getState().theaters.find((t) => t.theaterId === id)?.source
}

describe('recent store: legacy theater migration', () => {
  it('treats entries with an owner as created and everything else as opened', () => {
    const migrated = migrateTheaters([
      { theaterId: 'a', ownerId: 'user-1', updatedAt: 1 },
      { theaterId: 'b', updatedAt: 2 },
      { theaterId: 'c', source: 'opened', ownerId: 'user-1', updatedAt: 3 },
    ])

    expect(migrated.map((t) => [t.theaterId, t.source])).toEqual([
      ['a', 'created'],
      ['b', 'opened'],
      ['c', 'opened'],
    ])
  })

  it('returns an empty list for invalid input', () => {
    expect(migrateTheaters(undefined)).toEqual([])
    expect(migrateTheaters('nope')).toEqual([])
  })

  it('migrates legacy stored data when loading a user', () => {
    localStorage.setItem(
      getStorageKey('legacy-user'),
      JSON.stringify({
        movies: [],
        screens: [],
        theaters: [
          { theaterId: 'mine', name: 'Mine', ownerId: 'legacy-user', updatedAt: 1 },
          { theaterId: 'seen', name: 'Seen', updatedAt: 2 },
        ],
      }),
    )

    useRecentStore.getState().loadForUser('legacy-user')

    const { theaters } = useRecentStore.getState()
    expect(theaters.find((t) => t.theaterId === 'mine')?.source).toBe('created')
    expect(theaters.find((t) => t.theaterId === 'seen')?.source).toBe('opened')
  })
})

describe('recent store: theater ownership flow', () => {
  beforeEach(() => {
    localStorage.clear()
    useRecentStore.getState().loadForUser('owner-1')
  })

  it('records a theater that was only viewed as opened', () => {
    useRecentStore.getState().saveTheater({ ...theaterInput, source: 'opened' })
    expect(theaterSource()).toBe('opened')
  })

  it('marks a theater created when the owner enables management', () => {
    useRecentStore.getState().saveTheater({ ...theaterInput, source: 'opened' })
    useRecentStore.getState().setTheaterSource('t-1', 'created')

    expect(theaterSource()).toBe('created')
  })

  it('does not downgrade a created theater when it is merely viewed again', () => {
    useRecentStore.getState().saveTheater({ ...theaterInput, source: 'created' })
    useRecentStore.getState().saveTheater({ ...theaterInput, source: 'opened' })

    expect(theaterSource()).toBe('created')
  })

  it('reverts to opened when a 403 revokes management', () => {
    useRecentStore.getState().saveTheater({ ...theaterInput, source: 'opened' })
    useRecentStore.getState().setTheaterSource('t-1', 'created')
    useRecentStore.getState().setTheaterSource('t-1', 'opened')

    expect(theaterSource()).toBe('opened')
  })

  it('stays opened after revoke even if the page saves it again as opened', () => {
    useRecentStore.getState().saveTheater({ ...theaterInput, source: 'created' })
    useRecentStore.getState().setTheaterSource('t-1', 'opened')
    useRecentStore.getState().saveTheater({ ...theaterInput, source: 'opened' })

    expect(theaterSource()).toBe('opened')
  })

  it('persists the ownership choice per user', () => {
    useRecentStore.getState().saveTheater({ ...theaterInput, source: 'opened' })
    useRecentStore.getState().setTheaterSource('t-1', 'created')

    useRecentStore.getState().loadForUser('someone-else')
    expect(useRecentStore.getState().theaters).toHaveLength(0)

    useRecentStore.getState().loadForUser('owner-1')
    expect(theaterSource()).toBe('created')
  })

  it('ignores setTheaterSource for a theater that is not stored', () => {
    useRecentStore.getState().setTheaterSource('missing', 'created')
    expect(useRecentStore.getState().theaters).toHaveLength(0)
  })
})
