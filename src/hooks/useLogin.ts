import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { authApi, decodeJwtClaims, getCachedUsername } from '@/api'
import { useAuthStore } from '@/store/auth.store'
import type { LoginRequest, UserRole } from '@/types/api'
import { normalizeRole } from '@/types/api'

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (token) => {
      const claims = decodeJwtClaims(token)
      const role = normalizeRole(claims.role) ?? 'ROLE_USER'
      const email = claims.email ?? claims.sub ?? ''
      const userId = claims.userId ? String(claims.userId) : ''

      // Use cached real username if user previously registered or updated profile on this device
      const cachedUsername = getCachedUsername(userId) || getCachedUsername(email)
      const username = cachedUsername || email.split('@')[0] || 'User'

      setSession({
        token,
        userId,
        email,
        username,
        role: role as UserRole,
      })
      toast.success('Welcome back!')
    },
    onError: () => {
      // Errors are rendered inline in LoginPage
    },
  })
}
