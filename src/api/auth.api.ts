import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserRegisterResponse,
  UserRequest,
} from '@/types/api'

import { apiClient } from './client'

export const authApi = {
  /** POST /register — public. Always creates ROLE_USER. */
  register: (body: RegisterRequest) =>
    apiClient.post<UserRegisterResponse>('/register', body, { auth: false }),

  /** POST /login — public. Returns raw JWT string. */
  login: (body: LoginRequest) =>
    apiClient.post<LoginResponse>('/login', body, { auth: false }),

  /** PUT /users/{userId} — target user or ROLE_ADMIN. Requires all 3 fields. */
  updateUser: (userId: string, body: UserRequest) =>
    apiClient.put<UserRegisterResponse>(`/users/${userId}`, body),

  /** DELETE /users/{userId} — soft delete; target user or ROLE_ADMIN. */
  deleteUser: (userId: string) => apiClient.delete<void>(`/users/${userId}`),
}
