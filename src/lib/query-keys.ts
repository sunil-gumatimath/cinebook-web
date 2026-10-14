/**
 * Centralized TanStack Query keys so invalidation stays consistent.
 */
export const queryKeys = {
  movie: (movieId: string) => ['movies', movieId] as const,
  feedback: (movieId: string, page: number, size: number) =>
    ['movies', movieId, 'feedback', { page, size }] as const,

  theater: (theaterId: string) => ['theaters', theaterId] as const,
  screen: (screenId: string) => ['screens', screenId] as const,
} as const
