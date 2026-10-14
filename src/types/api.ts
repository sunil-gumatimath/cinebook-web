/**
 * TypeScript mirrors of the Spring Boot DTOs and enums.
 * Source of truth: the dto and enums packages under
 * movie-ticket-booking-system-api/src/main/java/com/example/
 */

// ---------------------------------------------------------------------------
// Enums (mirrors Java enums — string values match @JsonValue)
// ---------------------------------------------------------------------------

export const ROLES = ['USER', 'THEATER_OWNER', 'ADMIN'] as const
export type Role = (typeof ROLES)[number]

export const CERTIFICATES = ['UA', 'A', 'S', 'UA_13_PLUS', 'A_13_PLUS', 'PG', 'PG_13_PLUS'] as const
export type Certificate = (typeof CERTIFICATES)[number]

export const GENRES = [
  'DRAMA',
  'ACTION',
  'COMEDY',
  'ROMANCE',
  'HORROR',
  'THRILLER',
  'SCIENCE_FICTION',
  'FAMILY',
] as const
export type Genre = (typeof GENRES)[number]

export const SCREEN_TYPES = ['IMAX', 'THREE_D', 'FOUR_D', 'DOLBY_ATMOS', 'VR', 'REGULAR'] as const
export type ScreenType = (typeof SCREEN_TYPES)[number]

// ---------------------------------------------------------------------------
// Auth & user
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  username: string
  email: string
  phoneNumber: string
  password: string
  /** ISO-8601 date, e.g. "1990-05-15" */
  dateOfBirth: string
}

export type LoginResponse = string

export interface LoginRequest {
  email: string
  password: string
}

// (Removed; backend /login returns a raw JWT string wrapped in ResponseStructure<String>.)

export interface UpdateUserRequest {
  username?: string
  phoneNumber?: string
  dateOfBirth?: string
}

export interface UserResponse {
  id: string
  username: string
  email: string
  phoneNumber?: string
  dateOfBirth?: string
  role: Role
  active: boolean
}

// ---------------------------------------------------------------------------
// Movies
// ---------------------------------------------------------------------------

export interface CreateMovieRequest {
  title: string
  description: string
  /** ISO-8601 duration, e.g. "PT2H" */
  runtime: string
  certificate: Certificate
  genre: Genre
  castList: string[]
}

export interface MovieResponse {
  id: string
  title: string
  description: string
  /** ISO-8601 duration string from Java Duration, e.g. "PT2H" */
  runtime: string
  certificate: Certificate
  genre: Genre
  castList: string[]
  averageRating?: number
}

// ---------------------------------------------------------------------------
// Theaters & screens
// ---------------------------------------------------------------------------

export interface RegisterTheaterRequest {
  name: string
  address: string
  city: string
  landmark?: string
}

export interface UpdateTheaterRequest {
  name?: string
  address?: string
  city?: string
  landmark?: string
}

export interface TheaterResponse {
  id: string
  name: string
  address: string
  city: string
  landmark?: string
  ownerId: string
  screens?: ScreenResponse[]
}

// ---------------------------------------------------------------------------
// Seat layout
// ---------------------------------------------------------------------------

export interface SeatResponse {
  id: string
  rowLabel: string
  /** Column number within the row, 1-based. */
  seatNumber: number
  category: SeatCategory
  status: SeatStatus
}

export const SEAT_CATEGORIES = ['REGULAR', 'PREMIUM', 'RECLINER', 'VIP', 'COUPLES'] as const
export type SeatCategory = (typeof SEAT_CATEGORIES)[number]

export const SEAT_STATUSES = ['AVAILABLE', 'BOOKED', 'BLOCKED'] as const
export type SeatStatus = (typeof SEAT_STATUSES)[number]

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

export interface AddScreenRequest {
  screenType: ScreenType
  capacity: number
  noOfRows: number
}

export interface ScreenResponse {
  id: string
  theaterId: string
  screenType: ScreenType
  capacity: number
  noOfRows: number
  seats?: SeatResponse[]
}

// ---------------------------------------------------------------------------
// Shows
// ---------------------------------------------------------------------------

export interface AddShowRequest {
  /** Epoch milliseconds, e.g. 1735094400000 */
  startTimeEpochMillis: number
  movieId: string
}

export interface ShowResponse {
  id: string
  screenId: string
  theaterId: string
  movieId: string
  startTimeEpochMillis: number
  endTimeEpochMillis: number
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export interface CreateFeedbackRequest {
  /** 1..5 */
  rating: number
  review: string
}

export interface FeedbackResponse {
  id: string
  movieId: string
  userId: string
  username: string
  rating: number
  review: string
  createdAt: string
}

/** Spring's Page<T> envelope as serialized by Jackson. */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}
