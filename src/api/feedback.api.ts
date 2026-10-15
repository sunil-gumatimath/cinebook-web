import type { FeedbackRequest, FeedbackResponse } from '@/types/api'

import { apiClient } from './client'

export const feedbackApi = {
  /** POST /movies/{movieId}/feedback — ROLE_USER only. One feedback per user per movie. */
  create: (movieId: string, body: FeedbackRequest) =>
    apiClient.post<FeedbackResponse>(`/movies/${movieId}/feedback`, body),

  /** GET /movies/{movieId}/feedback?page=&size= — newest first, plain array of feedback responses. */
  listForMovie: (movieId: string, page = 0, size = 20, signal?: AbortSignal) =>
    apiClient.get<FeedbackResponse[]>(`/movies/${movieId}/feedback`, {
      params: { page, size },
      signal,
    }),
}
