/**
 * Utilities for working with ISO-8601 durations (e.g. "PT2H15M") used by Spring Boot's java.time.Duration.
 */

export interface ParsedDuration {
  hours: number
  minutes: number
  totalMinutes: number
}

/**
 * Parses an ISO-8601 duration string into hours, minutes, and total minutes.
 * Handles patterns like "PT2H15M", "PT2H", "PT45M", "PT1H30M15S", etc.
 */
export function parseIsoDuration(durationStr: string | null | undefined): ParsedDuration {
  if (!durationStr || typeof durationStr !== 'string') {
    return { hours: 0, minutes: 0, totalMinutes: 0 }
  }

  const normalized = durationStr.trim().toUpperCase()
  if (!normalized.startsWith('P')) {
    return { hours: 0, minutes: 0, totalMinutes: 0 }
  }

  const hoursMatch = normalized.match(/(\d+)H/)
  const minutesMatch = normalized.match(/(\d+)M/)
  const secondsMatch = normalized.match(/(\d+)S/)

  const hours = hoursMatch?.[1] ? parseInt(hoursMatch[1], 10) : 0
  const minutes = minutesMatch?.[1] ? parseInt(minutesMatch[1], 10) : 0
  const seconds = secondsMatch?.[1] ? parseInt(secondsMatch[1], 10) : 0

  const totalMinutes = hours * 60 + minutes + Math.round(seconds / 60)

  return {
    hours,
    minutes,
    totalMinutes,
  }
}

/**
 * Formats an ISO-8601 duration into a human-readable string like "2h 15m", "1h", or "45m".
 */
export function formatRuntime(durationStr: string | null | undefined): string {
  const { hours, minutes, totalMinutes } = parseIsoDuration(durationStr)

  if (totalMinutes === 0) return '0m'
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h`
  return `${minutes}m`
}

/**
 * Converts hours and minutes into an ISO-8601 duration string like "PT2H15M".
 */
export function toIsoDuration(hours: number, minutes: number): string {
  const h = Math.max(0, Math.floor(hours || 0))
  const m = Math.max(0, Math.floor(minutes || 0))

  if (h === 0 && m === 0) return 'PT0M'
  if (h > 0 && m > 0) return `PT${h}H${m}M`
  if (h > 0) return `PT${h}H`
  return `PT${m}M`
}
