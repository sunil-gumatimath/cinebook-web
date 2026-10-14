import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, authApi } from '@/api'
import { useAuthStore } from '@/store/auth.store'
import type { LoginRequest } from '@/types/api'

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (data) => {
      setSession({
        token: data.token,
        userId: data.userId,
        email: data.email,
        username: data.username,
        role: data.role,
      })
      toast.success(`Welcome back, ${data.username}`)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError ? error.message : 'Login failed. Please try again.'
      toast.error(message)
    },
  })
}
