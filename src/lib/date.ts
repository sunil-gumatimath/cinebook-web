/**
 * Returns today's date formatted as YYYY-MM-DD in the user's local timezone.
 * Computed at runtime (not at module-load time) so day rollovers are accurate.
 */
export function getTodayLocalDateString(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear()
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0')
  const day = String(referenceDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * True when the given epoch milliseconds are at or before the current time.
 * Kept outside components so render code stays pure.
 */
export function isPastEpochMillis(epochMillis: number, nowMillis: number = Date.now()): boolean {
  return epochMillis <= nowMillis
}

/**
 * Checks if an ISO date string (YYYY-MM-DD) is strictly in the past
 * relative to the current local calendar date.
 */
export function isPastLocalDate(dateString: string, referenceDate: Date = new Date()): boolean {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false
  const today = getTodayLocalDateString(referenceDate)
  return dateString < today
}
