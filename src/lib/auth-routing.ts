import type { UserRole } from '@/types/api'

/**
 * Single source of truth for where to land after authenticating.
 *
 * Honours a non-trivial `requestedFrom` path (a guarded route the user tried to
 * open before signing in) and otherwise falls back to the role's home. Both the
 * login effect and the mutation callback must use this so they can never
 * disagree — previously one path treated `/` as "go to the role home" while the
 * other treated it as a literal redirect target.
 */
export function resolvePostLoginPath(
  role: UserRole | null,
  requestedFrom?: string | null,
): string {
  if (
    requestedFrom &&
    requestedFrom !== '/' &&
    requestedFrom !== '/login' &&
    requestedFrom !== '/register'
  ) {
    return requestedFrom
  }

  if (role === 'ROLE_THEATER_OWNER') return '/owner'
  if (role === 'ROLE_ADMIN') return '/admin'
  return '/movies'
}
