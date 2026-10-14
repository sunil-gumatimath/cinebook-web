import type { Role } from '@/types/api'
import { useAuthStore } from '@/store/auth.store'

import { Navigate, Outlet, useLocation } from 'react-router-dom'

interface RequireAuthProps {
  /** If provided, the user must hold one of these roles. */
  roles?: Role[]
}

/**
 * Route guard: redirects unauthenticated users to /login, and users with the
 * wrong role to /forbidden. Preserves the attempted path so login can bounce
 * the user back where they wanted to go.
 */
export function RequireAuth({ roles }: RequireAuthProps) {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && (role === null || !roles.includes(role))) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
