import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { authApi, decodeJwtClaims, getCachedUsername } from '@/api'
import { useAuthStore } from '@/store/auth.store'
import type { LoginRequest } from '@/types/api'
import { normalizeRole } from '@/types/api'

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (token) => {
      // A bare (non-JSON) token body would previously arrive as `null` and crash
      // the claim decoder — fail loudly instead.
      if (typeof token !== 'string' || token.length === 0) {
        toast.error('Sign in failed: the server returned an unexpected response.')
        return
      }

      const claims = decodeJwtClaims(token)
      const role = normalizeRole(claims.role) ?? 'ROLE_USER'
      const email = claims.email ?? claims.sub ?? ''
      const userIdClaim = claims.userId ?? claims.id ?? claims.uid
      const userId = userIdClaim !== undefined ? String(userIdClaim) : ''

      // Use cached real username if user previously registered or updated profile on this device
      const cachedUsername = getCachedUsername(userId) || getCachedUsername(email)
      const username = cachedUsername || email.split('@')[0] || 'User'

      setSession({
        token,
        userId,
        email,
        username,
        role,
      })
      toast.success('Welcome back!')
    },
    onError: () => {
      // Errors are rendered inline in LoginPage
    },
  })
}
