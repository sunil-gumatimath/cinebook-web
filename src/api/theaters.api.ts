import type {
  AddScreenRequest,
  AddShowRequest,
  RegisterTheaterRequest,
  ScreenResponse,
  ShowResponse,
  TheaterResponse,
  UpdateTheaterRequest,
} from '@/types/api'

import { apiClient } from './client'

export const theatersApi = {
  /** POST /theater/register — ROLE_THEATER_OWNER. */
  register: (body: RegisterTheaterRequest) =>
    apiClient.post<TheaterResponse>('/theater/register', body),

  /** GET /theater/{id} */
  getById: (theaterId: string, signal?: AbortSignal) =>
    apiClient.get<TheaterResponse>(`/theater/${theaterId}`, { signal }),

  /** PUT /theater/{id} — owner only. */
  update: (theaterId: string, body: UpdateTheaterRequest) =>
    apiClient.put<TheaterResponse>(`/theater/${theaterId}`, body),

  /** POST /screen?theaterId=... — owner only. Generates the seat layout. */
  addScreen: (theaterId: string, body: AddScreenRequest) =>
    apiClient.post<ScreenResponse>('/screen', body, { params: { theaterId } }),

  /** GET /screen/{screenId} — includes the generated seat layout. */
  getScreen: (screenId: string, signal?: AbortSignal) =>
    apiClient.get<ScreenResponse>(`/screen/${screenId}`, { signal }),

  /** POST /theaters/{theaterId}/screens/{screenId}/shows — owner only. */
  addShow: (theaterId: string, screenId: string, body: AddShowRequest) =>
    apiClient.post<ShowResponse>(`/theaters/${theaterId}/screens/${screenId}/shows`, body),
}
