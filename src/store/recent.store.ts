import { create } from 'zustand'

import { readStoredAuth } from '@/api/token.storage'

export interface RecentMovie {
  movieId: string
  title?: string
  genre?: string
  certificate?: string
  runtime?: string
  ratings?: number
  updatedAt: number
}

export interface RecentTheater {
  theaterId: string
  name?: string
  city?: string
  address?: string
  landmark?: string
  source?: 'created' | 'opened'
  ownerId?: string
  updatedAt: number
}

export interface RecentScreen {
  screenId: string
  theaterId?: string
  screenType?: string
  capacity?: number
  noOfRows?: number
  updatedAt: number
}

interface RecentStoreState {
  userId: string | null
  movies: RecentMovie[]
  theaters: RecentTheater[]
  screens: RecentScreen[]

  loadForUser: (userId: string | null) => void

  saveMovie: (movie: {
    movieId: string
    title?: string
    genre?: string
    certificate?: string
    runtime?: string
    ratings?: number
    description?: string
    castList?: string[]
  }) => void
  removeMovie: (movieId: string) => void

  saveTheater: (theater: {
    theaterId: string
    name?: string
    city?: string
    address?: string
    landmark?: string
    source?: 'created' | 'opened'
    ownerId?: string
  }) => void
  removeTheater: (theaterId: string) => void
  /** Explicitly enable ('created') or revoke ('opened') management for a theater. */
  setTheaterSource: (theaterId: string, source: 'created' | 'opened') => void

  saveScreen: (screen: {
    screenId: string
    theaterId?: string
    screenType?: string
    capacity?: number
    noOfRows?: number
  }) => void
  removeScreen: (screenId: string) => void

  clearAll: () => void
}

export function getStorageKey(userId?: string | null): string {
  return userId ? `cinebook.recent.v1.${userId}` : 'cinebook.recent.v1.guest'
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

/**
 * Theaters saved before the `source` field existed have none. Treat entries that
 * recorded an owner as created by this user, and everything else as merely opened.
 */
export function migrateTheaters(list: unknown): RecentTheater[] {
  if (!Array.isArray(list)) return []
  return list.map((t: RecentTheater) => ({
    ...t,
    source: t.source ?? (t.ownerId ? 'created' : 'opened'),
  }))
}

function loadFromStorage(userId?: string | null): {
  movies: RecentMovie[]
  theaters: RecentTheater[]
  screens: RecentScreen[]
} {
  try {
    const storage = getStorage()
    if (!storage) return { movies: [], theaters: [], screens: [] }
    const raw = storage.getItem(getStorageKey(userId))
    if (!raw) return { movies: [], theaters: [], screens: [] }
    const parsed = JSON.parse(raw)
    return {
      movies: Array.isArray(parsed.movies) ? parsed.movies : [],
      theaters: migrateTheaters(parsed.theaters),
      screens: Array.isArray(parsed.screens) ? parsed.screens : [],
    }
  } catch {
    return { movies: [], theaters: [], screens: [] }
  }
}

function persistToStorage(
  userId: string | null,
  data: {
    movies: RecentMovie[]
    theaters: RecentTheater[]
    screens: RecentScreen[]
  },
) {
  try {
    getStorage()?.setItem(getStorageKey(userId), JSON.stringify(data))
  } catch {
    // ignore
  }
}

const initialAuth = readStoredAuth()
const initialUserId = initialAuth?.userId ?? null
const initialData = loadFromStorage(initialUserId)

export const useRecentStore = create<RecentStoreState>()((set, get) => ({
  userId: initialUserId,
  movies: initialData.movies,
  theaters: initialData.theaters,
  screens: initialData.screens,

  loadForUser: (userId) => {
    const data = loadFromStorage(userId)
    set({
      userId,
      movies: data.movies,
      theaters: data.theaters,
      screens: data.screens,
    })
  },

  saveMovie: (movie) => {
    set((state) => {
      const existing = state.movies.filter((m) => m.movieId !== movie.movieId)
      const updatedMovie: RecentMovie = {
        ...state.movies.find((m) => m.movieId === movie.movieId),
        ...movie,
        updatedAt: Date.now(),
      }
      const newMovies = [updatedMovie, ...existing].slice(0, 50)
      persistToStorage(state.userId, { ...state, movies: newMovies })
      return { movies: newMovies }
    })
  },

  removeMovie: (movieId) => {
    set((state) => {
      const newMovies = state.movies.filter((m) => m.movieId !== movieId)
      persistToStorage(state.userId, { ...state, movies: newMovies })
      return { movies: newMovies }
    })
  },

  saveTheater: (theater) => {
    set((state) => {
      const existing = state.theaters.filter((t) => t.theaterId !== theater.theaterId)
      const prev = state.theaters.find((t) => t.theaterId === theater.theaterId)
      // Merely viewing a theater must never downgrade one this user created.
      // Use setTheaterSource to enable or revoke ownership explicitly.
      const source =
        theater.source === 'created' || prev?.source === 'created'
          ? 'created'
          : (theater.source ?? prev?.source ?? 'opened')

      const updatedTheater: RecentTheater = {
        ...prev,
        ...theater,
        source,
        ownerId: theater.ownerId ?? prev?.ownerId,
        updatedAt: Date.now(),
      }
      const newTheaters = [updatedTheater, ...existing].slice(0, 50)
      persistToStorage(state.userId, { ...state, theaters: newTheaters })
      return { theaters: newTheaters }
    })
  },

  setTheaterSource: (theaterId, source) => {
    set((state) => {
      const newTheaters = state.theaters.map((t) =>
        t.theaterId === theaterId ? { ...t, source, updatedAt: Date.now() } : t,
      )
      persistToStorage(state.userId, { ...state, theaters: newTheaters })
      return { theaters: newTheaters }
    })
  },

  removeTheater: (theaterId) => {
    set((state) => {
      const newTheaters = state.theaters.filter((t) => t.theaterId !== theaterId)
      persistToStorage(state.userId, { ...state, theaters: newTheaters })
      return { theaters: newTheaters }
    })
  },

  saveScreen: (screen) => {
    set((state) => {
      const existing = state.screens.filter((s) => s.screenId !== screen.screenId)
      const prev = state.screens.find((s) => s.screenId === screen.screenId)
      const updatedScreen: RecentScreen = {
        ...prev,
        ...screen,
        theaterId: screen.theaterId ?? prev?.theaterId,
        updatedAt: Date.now(),
      }
      const newScreens = [updatedScreen, ...existing].slice(0, 50)
      persistToStorage(state.userId, { ...state, screens: newScreens })
      return { screens: newScreens }
    })
  },

  removeScreen: (screenId) => {
    set((state) => {
      const newScreens = state.screens.filter((s) => s.screenId !== screenId)
      persistToStorage(state.userId, { ...state, screens: newScreens })
      return { screens: newScreens }
    })
  },

  clearAll: () => {
    const userId = get().userId
    const reset = { userId: null, movies: [], theaters: [], screens: [] }
    persistToStorage(userId, { movies: [], theaters: [], screens: [] })
    try {
      getStorage()?.removeItem(getStorageKey(userId))
    } catch {
      // ignore
    }
    set(reset)
  },
}))

export function purgeUserData(userId: string): void {
  if (!userId) return
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(getStorageKey(userId))
    storage.removeItem(`mtbs.username.${userId.toLowerCase()}`)
    const stored = readStoredAuth()
    if (stored?.userId === userId && stored.email) {
      storage.removeItem(`mtbs.username.${stored.email.toLowerCase()}`)
    }
    const current = useRecentStore.getState()
    if (current.userId === userId) {
      current.loadForUser(null)
    }
  } catch {
    // ignore
  }
}
