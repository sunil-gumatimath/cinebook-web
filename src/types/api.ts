/**
 * TypeScript mirrors of the Spring Boot DTOs and enums.
 * Source of truth: movie-ticket-booking-system-api
 *
 * Ground-truth endpoints:
 * 1.  POST /register
 * 2.  POST /login
 * 3.  PUT /users/{userId}
 * 4.  DELETE /users/{userId}
 * 5.  POST /theater/register
 * 6.  GET /theater/{id}
 * 7.  PUT /theater/{id}
 * 8.  POST /screen?theaterId=
 * 9.  GET /screen/{screenId}
 * 10. POST /movies
 * 11. PUT /movies/{movieId}
 * 12. PUT /movies/{movieId}/description
 * 13. PUT /movies/{movieId}/cast
 * 14. GET /movies/{movieId}
 * 15. POST /theaters/{theaterId}/screens/{screenId}/shows
 * 16. POST /movies/{movieId}/feedback
 * 17. GET /movies/{movieId}/feedback?page=&size=
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const USER_ROLES = ['ROLE_USER', 'ROLE_THEATER_OWNER', 'ROLE_ADMIN'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const CERTIFICATES = ['U', 'UA', 'A', 'S'] as const
export type Certificate = (typeof CERTIFICATES)[number]

export const GENRES = [
  'ACTION',
  'ANIMATION',
  'COMEDY',
  'DRAMA',
  'HORROR',
  'ROMANCE',
  'SCIENCE_FICTION',
  'THRILLER',
] as const
export type Genre = (typeof GENRES)[number]

export const SCREEN_TYPES = ['TWO_D', 'THREE_D', 'IMAX'] as const
export type ScreenType = (typeof SCREEN_TYPES)[number]

// ---------------------------------------------------------------------------
// Role presentation mapping
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<UserRole, string> = {
  ROLE_USER: 'Member',
  ROLE_THEATER_OWNER: 'Theater owner',
  ROLE_ADMIN: 'Admin',
}

export function formatRole(role: UserRole | string | null | undefined): string {
  if (!role) return 'Guest'
  if (role in ROLE_LABELS) {
    return ROLE_LABELS[role as UserRole]
  }
  // If legacy un-prefixed format exists
  if (role === 'USER') return 'Member'
  if (role === 'THEATER_OWNER') return 'Theater owner'
  if (role === 'ADMIN') return 'Admin'
  return role
}

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null
  if (role.startsWith('ROLE_') && USER_ROLES.includes(role as UserRole)) {
    return role as UserRole
  }
  const prefixed = `ROLE_${role}` as UserRole
  if (USER_ROLES.includes(prefixed)) {
    return prefixed
  }
  return null
}

// ---------------------------------------------------------------------------
// Auth & User DTOs
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  username: string
  /** Must end with @gmail.com */
  email: string
  /** 10 digits starting with 7, 8, or 9 */
  phoneNumber: string
  /** 8-64 chars, upper + lower + digit + special */
  password: string
  /** Past ISO date YYYY-MM-DD */
  dateOfBirth: string
}

export interface LoginRequest {
  email: string
  password: string
}

export type LoginResponse = string

export interface UserRegisterResponse {
  userId: string
  username: string
  email: string
  userRole: UserRole
}

export interface UserRequest {
  username: string
  phoneNumber: string
  dateOfBirth: string
}

// ---------------------------------------------------------------------------
// Theater DTOs
// ---------------------------------------------------------------------------

export interface TheaterRequest {
  name: string
  address: string
  city: string
  landmark: string
}

export interface TheaterResponse {
  theaterId: string
  name: string
  address: string
  city: string
  landmark: string
}

// ---------------------------------------------------------------------------
// Screen DTOs
// ---------------------------------------------------------------------------

export interface ScreenRequest {
  screenType: ScreenType
  capacity: number
  noOfRows: number
}

export interface ScreenResponse {
  screenId: string
  screenType: ScreenType
  capacity: number
  noOfRows: number
}

export interface SeatResponse {
  seatId: string
  seatName: string
}

export interface ScreenDetailResponse {
  screenId: string
  screenType: ScreenType
  capacity: number
  noOfRows: number
  seatResponses: SeatResponse[]
}

// ---------------------------------------------------------------------------
// Movie DTOs
// ---------------------------------------------------------------------------

export interface MovieRequest {
  title: string
  description: string
  /** ISO-8601 duration string, e.g. "PT2H15M" */
  runtime: string
  certificate: Certificate
  genre: Genre
  castList: string[]
}

export interface MovieUpdateRequest {
  title: string
}

export interface MovieDescriptionUpdateRequest {
  description: string
}

export interface MovieCastUpdateRequest {
  castList: string[]
}

export interface MovieResponse {
  movieId: string
  title: string
  description: string
  ratings: number
  /** ISO-8601 duration string, e.g. "PT2H15M" */
  runtime: string
  certificate: Certificate
  genre: Genre
  castList: string[]
}

// ---------------------------------------------------------------------------
// Show DTOs
// ---------------------------------------------------------------------------

export interface ShowRequest {
  /** Future epoch milliseconds */
  startTimeEpochMillis: number
  movieId: string
}

export interface ShowResponse {
  showId: string
  movieTitle: string
  theaterName: string
  screenId: string
  startTimeEpochMillis: number
  endTimeEpochMillis: number
}

// ---------------------------------------------------------------------------
// Feedback DTOs
// ---------------------------------------------------------------------------

export interface FeedbackRequest {
  /** 1..5 */
  rating: number
  /** Max 500 characters */
  review: string
}

export interface FeedbackResponse {
  feedbackId: string
  rating: number
  review: string
  /** ISO Instant string */
  createdAt: string
  movieId: string
  movieTitle: string
}
