/**
 * Centralized TanStack Query keys so invalidation stays consistent.
 */
export const queryKeys = {
  movie: (movieId: string) => ['movies', movieId] as const,
  /** Infinite, newest-first review list for a movie (page size is fixed client-side). */
  feedback: (movieId: string) => ['movies', movieId, 'feedback'] as const,

  theater: (theaterId: string) => ['theaters', theaterId] as const,
  screen: (screenId: string) => ['screens', screenId] as const,
} as const
