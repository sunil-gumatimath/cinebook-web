import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types/api'

interface RequireAuthProps {
  /** If provided, the user must hold one of these roles. */
  roles?: UserRole[]
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
    // Preserve the full attempted URL (path + query + hash) so login can return
    // the user to exactly where they were.
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" state={{ from }} replace />
  }

  if (roles && (role === null || !roles.includes(role))) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
