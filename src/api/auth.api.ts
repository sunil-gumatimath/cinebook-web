import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateUserRequest,
  UserResponse,
} from '@/types/api'

import { apiClient } from './client'

export const authApi = {
  /** POST /register — public. Always creates ROLE_USER. */
  register: (body: RegisterRequest) =>
    apiClient.post<UserResponse>('/register', body, { auth: false }),

  /** POST /login — public. Returns a JWT. */
  login: (body: LoginRequest) =>
    apiClient.post<LoginResponse>('/login', body, { auth: false }),

  /** PUT /users/{userId} — self or ROLE_ADMIN. */
  updateUser: (userId: string, body: UpdateUserRequest) =>
    apiClient.put<UserResponse>(`/users/${userId}`, body),

  /** DELETE /users/{userId} — soft delete; self or ROLE_ADMIN. */
  deleteUser: (userId: string) => apiClient.delete<void>(`/users/${userId}`),
}
