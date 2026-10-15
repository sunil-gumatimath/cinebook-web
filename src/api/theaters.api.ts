import type {
  ScreenDetailResponse,
  ScreenRequest,
  ScreenResponse,
  ShowRequest,
  ShowResponse,
  TheaterRequest,
  TheaterResponse,
} from '@/types/api'

import { apiClient } from './client'

export const theatersApi = {
  /** POST /theater/register — ROLE_THEATER_OWNER. All 4 fields required. */
  register: (body: TheaterRequest) =>
    apiClient.post<TheaterResponse>('/theater/register', body),

  /** GET /theater/{id} — any JWT. */
  getById: (theaterId: string, signal?: AbortSignal) =>
    apiClient.get<TheaterResponse>(`/theater/${theaterId}`, { signal }),

  /** PUT /theater/{id} — owner only. Full PUT of all 4 fields. */
  update: (theaterId: string, body: TheaterRequest) =>
    apiClient.put<TheaterResponse>(`/theater/${theaterId}`, body),

  /** POST /screen?theaterId=... — owner only. */
  addScreen: (theaterId: string, body: ScreenRequest) =>
    apiClient.post<ScreenResponse>('/screen', body, { params: { theaterId } }),

  /** GET /screen/{screenId} — any JWT. Includes seatResponses [{seatId, seatName}]. */
  getScreen: (screenId: string, signal?: AbortSignal) =>
    apiClient.get<ScreenDetailResponse>(`/screen/${screenId}`, { signal }),

  /** POST /theaters/{theaterId}/screens/{screenId}/shows — owner only. */
  addShow: (theaterId: string, screenId: string, body: ShowRequest) =>
    apiClient.post<ShowResponse>(`/theaters/${theaterId}/screens/${screenId}/shows`, body),
}
