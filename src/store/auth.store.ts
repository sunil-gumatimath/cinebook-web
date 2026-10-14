import { create } from 'zustand'

import { clearStoredAuth, readStoredAuth, writeStoredAuth } from '@/api/token.storage'
import type { Role } from '@/types/api'

interface AuthState {
  token: string | null
  userId: string | null
  email: string | null
  username: string | null
  role: Role | null
  isAuthenticated: () => boolean
  setSession: (session: {
    token: string
    userId: string
    email: string
    username: string
    role: Role
  }) => void
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

const initial = readStoredAuth()

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: initial?.token ?? null,
  userId: initial?.userId ?? null,
  email: initial?.email ?? null,
  username: initial?.username ?? null,
  role: (initial?.role as Role | undefined) ?? null,

  isAuthenticated: () => get().token !== null,

  setSession: (session) => {
    writeStoredAuth(session)
    set({
      token: session.token,
      userId: session.userId,
      email: session.email,
      username: session.username,
      role: session.role,
    })
  },

  logout: () => {
    clearStoredAuth()
    set({ token: null, userId: null, email: null, username: null, role: null })
  },

  hasRole: (...roles) => {
    const role = get().role
    return role !== null && roles.includes(role)
  },
}))
