import { create } from 'zustand'
import { toast } from 'sonner'

import {
  cacheUsername,
  clearStoredAuth,
  getTokenRemainingMs,
  readStoredAuth,
  writeStoredAuth,
} from '@/api/token.storage'
import { navigateTo } from '@/lib/navigation'
import { queryClient } from '@/lib/queryClient'
import { useRecentStore } from '@/store/recent.store'
import type { UserRole } from '@/types/api'

interface AuthState {
  token: string | null
  userId: string | null
  email: string | null
  username: string | null
  role: UserRole | null
  isAuthenticated: () => boolean
  setSession: (session: {
    token: string
    userId: string
    email: string
    username: string
    role: UserRole
  }) => void
  setUsername: (username: string) => void
  logout: (options?: { reason?: string }) => void
  hasRole: (...roles: UserRole[]) => boolean
}

let expiryTimer: ReturnType<typeof setTimeout> | null = null

function clearExpiryTimer() {
  if (expiryTimer) {
    clearTimeout(expiryTimer)
    expiryTimer = null
  }
}

function scheduleExpiryTimer(token: string, onExpired: () => void) {
  clearExpiryTimer()
  const remainingMs = getTokenRemainingMs(token)
  if (remainingMs <= 0 || !Number.isFinite(remainingMs)) {
    onExpired()
    return
  }
  // Max setTimeout is ~24.8 days (2147483647 ms), tokens are 24h
  expiryTimer = setTimeout(onExpired, Math.min(remainingMs, 2147483647))
}

const initial = readStoredAuth()

export const useAuthStore = create<AuthState>()((set, get) => {
  const handleTokenExpiry = () => {
    if (get().token) {
      get().logout({ reason: 'Session expired' })
      const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        navigateTo('/login', { replace: true, state: { from: currentPath } })
      }
    }
  }

  // Schedule expiry timer on startup if we already have a valid session
  if (initial?.token) {
    scheduleExpiryTimer(initial.token, handleTokenExpiry)
  }

  return {
    token: initial?.token ?? null,
    userId: initial?.userId ?? null,
    email: initial?.email ?? null,
    username: initial?.username ?? null,
    role: initial?.role ?? null,

    isAuthenticated: () => get().token !== null,

    setSession: (session) => {
      writeStoredAuth(session)
      cacheUsername(session.userId, session.username)
      cacheUsername(session.email, session.username)

      scheduleExpiryTimer(session.token, handleTokenExpiry)
      useRecentStore.getState().loadForUser(session.userId)

      set({
        token: session.token,
        userId: session.userId,
        email: session.email,
        username: session.username,
        role: session.role,
      })
    },

    setUsername: (newUsername: string) => {
      const current = get()
      if (!current.token) return
      const updated = {
        token: current.token,
        userId: current.userId ?? '',
        email: current.email ?? '',
        username: newUsername,
        role: current.role ?? 'ROLE_USER',
      }
      writeStoredAuth(updated)
      if (current.userId) cacheUsername(current.userId, newUsername)
      if (current.email) cacheUsername(current.email, newUsername)
      set({ username: newUsername })
    },

    logout: (options) => {
      // Only surface the reason when a session is actually ending; concurrent
      // 401s from background queries each call logout() and would otherwise
      // stack identical toasts.
      const wasAuthenticated = get().token !== null

      clearExpiryTimer()
      clearStoredAuth()
      useRecentStore.getState().loadForUser(null)
      queryClient.clear()

      set({ token: null, userId: null, email: null, username: null, role: null })
      if (options?.reason && wasAuthenticated) {
        toast.error(options.reason)
      }
    },

    hasRole: (...roles) => {
      const role = get().role
      return role !== null && roles.includes(role)
    },
  }
})
