import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, authApi, decodeJwtClaims } from '@/api'
import { useAuthStore } from '@/store/auth.store'
import type { LoginRequest } from '@/types/api'

const ROLE_MAP: Record<string, string> = {
  ROLE_USER: 'USER',
  ROLE_THEATER_OWNER: 'THEATER_OWNER',
  ROLE_ADMIN: 'ADMIN',
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (token) => {
      const claims = decodeJwtClaims(token)
      const role = ROLE_MAP[claims.role ?? ''] ?? (claims.role ?? 'USER')
      const email = claims.email ?? claims.sub ?? ''
      const userId = claims.userId ?? ''

      setSession({
        token,
        userId,
        email,
        username: email.split('@')[0] || 'user',
        role: role as 'USER' | 'THEATER_OWNER' | 'ADMIN',
      })
      toast.success('Welcome back!')
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError ? error.message : 'Login failed. Please try again.'
      toast.error(message)
    },
  })
}
