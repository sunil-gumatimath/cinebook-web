import type { CreateFeedbackRequest, FeedbackResponse, PageResponse } from '@/types/api'

import { apiClient } from './client'

export const feedbackApi = {
  /** POST /movies/{movieId}/feedback — one feedback per movie per user. */
  create: (movieId: string, body: CreateFeedbackRequest) =>
    apiClient.post<FeedbackResponse>(`/movies/${movieId}/feedback`, body),

  /** GET /movies/{movieId}/feedback?page=&size= — newest first, paginated. */
  listForMovie: (movieId: string, page = 0, size = 20, signal?: AbortSignal) =>
    apiClient.get<PageResponse<FeedbackResponse>>(`/movies/${movieId}/feedback`, {
      params: { page, size },
      signal,
    }),
}
