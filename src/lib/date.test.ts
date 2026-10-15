import { describe, expect, it } from 'vitest'
import { getTodayLocalDateString, isPastEpochMillis, isPastLocalDate } from './date'

describe('date utilities', () => {
  it('formats dates in YYYY-MM-DD local format', () => {
    const d = new Date(2026, 4, 15) // May 15, 2026
    expect(getTodayLocalDateString(d)).toBe('2026-05-15')
  })

  it('pads single-digit months and days with leading zeroes', () => {
    const d = new Date(2026, 0, 5) // Jan 5, 2026
    expect(getTodayLocalDateString(d)).toBe('2026-01-05')
  })

  it('detects past and future epoch times', () => {
    expect(isPastEpochMillis(1_000, 2_000)).toBe(true)
    expect(isPastEpochMillis(2_000, 2_000)).toBe(true) // exactly now is not in the future
    expect(isPastEpochMillis(3_000, 2_000)).toBe(false)
  })

  it('validates strictly past local dates', () => {
    const todayRef = new Date(2026, 9, 15) // 2026-10-15
    expect(isPastLocalDate('2026-10-14', todayRef)).toBe(true)
    expect(isPastLocalDate('1990-05-20', todayRef)).toBe(true)
    expect(isPastLocalDate('2026-10-15', todayRef)).toBe(false) // today is not in the past
    expect(isPastLocalDate('2026-10-16', todayRef)).toBe(false) // tomorrow
    expect(isPastLocalDate('invalid', todayRef)).toBe(false)
  })
})
