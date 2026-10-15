import { describe, expect, it } from 'vitest'
import { formatRuntime, parseIsoDuration, toIsoDuration } from './duration'

describe('duration utilities', () => {
  describe('parseIsoDuration', () => {
    it('parses standard hours and minutes', () => {
      expect(parseIsoDuration('PT2H15M')).toEqual({
        hours: 2,
        minutes: 15,
        totalMinutes: 135,
      })
    })

    it('parses hours only', () => {
      expect(parseIsoDuration('PT2H')).toEqual({
        hours: 2,
        minutes: 0,
        totalMinutes: 120,
      })
    })

    it('parses minutes only', () => {
      expect(parseIsoDuration('PT45M')).toEqual({
        hours: 0,
        minutes: 45,
        totalMinutes: 45,
      })
    })

    it('handles seconds by rounding to nearest minute', () => {
      expect(parseIsoDuration('PT1H30M30S')).toEqual({
        hours: 1,
        minutes: 30,
        totalMinutes: 91,
      })
    })

    it('handles empty or malformed input gracefully', () => {
      expect(parseIsoDuration('')).toEqual({ hours: 0, minutes: 0, totalMinutes: 0 })
      expect(parseIsoDuration('invalid')).toEqual({ hours: 0, minutes: 0, totalMinutes: 0 })
      expect(parseIsoDuration(null as unknown as string)).toEqual({ hours: 0, minutes: 0, totalMinutes: 0 })
    })
  })

  describe('formatRuntime', () => {
    it('formats hours and minutes', () => {
      expect(formatRuntime('PT2H15M')).toBe('2h 15m')
    })

    it('formats hours only', () => {
      expect(formatRuntime('PT2H')).toBe('2h')
    })

    it('formats minutes only', () => {
      expect(formatRuntime('PT45M')).toBe('45m')
    })

    it('formats zero or invalid as 0m', () => {
      expect(formatRuntime('')).toBe('0m')
      expect(formatRuntime('PT0M')).toBe('0m')
    })
  })

  describe('toIsoDuration', () => {
    it('generates PT2H15M from 2 hours and 15 minutes', () => {
      expect(toIsoDuration(2, 15)).toBe('PT2H15M')
    })

    it('generates PT2H from 2 hours and 0 minutes', () => {
      expect(toIsoDuration(2, 0)).toBe('PT2H')
    })

    it('generates PT45M from 0 hours and 45 minutes', () => {
      expect(toIsoDuration(0, 45)).toBe('PT45M')
    })

    it('generates PT0M for 0 and 0', () => {
      expect(toIsoDuration(0, 0)).toBe('PT0M')
    })
  })
})
