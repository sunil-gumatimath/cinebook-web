import type { CreateMovieRequest, MovieResponse } from '@/types/api'

import { apiClient } from './client'

export const moviesApi = {
  /** POST /movies — ROLE_ADMIN only. */
  create: (body: CreateMovieRequest) => apiClient.post<MovieResponse>('/movies', body),

  /** PUT /movies/{movieId} — ROLE_ADMIN only. Updates the title. */
  updateTitle: (movieId: string, title: string) =>
    apiClient.put<MovieResponse>(`/movies/${movieId}`, { title }),

  /** PUT /movies/{movieId}/description — ROLE_ADMIN only. */
  updateDescription: (movieId: string, description: string) =>
    apiClient.put<MovieResponse>(`/movies/${movieId}/description`, { description }),

  /** PUT /movies/{movieId}/cast — ROLE_ADMIN only. */
  updateCast: (movieId: string, castList: string[]) =>
    apiClient.put<MovieResponse>(`/movies/${movieId}/cast`, { castList }),

  /** GET /movies/{movieId} */
  getById: (movieId: string, signal?: AbortSignal) =>
    apiClient.get<MovieResponse>(`/movies/${movieId}`, { signal }),
}
