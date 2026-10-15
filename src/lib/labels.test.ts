import { describe, expect, it } from 'vitest'
import {
  formatGenre,
  formatScreenType,
  GENRE_LABELS,
  SCREEN_TYPE_LABELS,
} from './labels'

describe('SCREEN_TYPE_LABELS and formatScreenType', () => {
  it('maps screen types correctly to human-readable strings', () => {
    expect(SCREEN_TYPE_LABELS.TWO_D).toBe('2D')
    expect(SCREEN_TYPE_LABELS.THREE_D).toBe('3D')
    expect(SCREEN_TYPE_LABELS.IMAX).toBe('IMAX')
  })

  it('formats screen types using helper', () => {
    expect(formatScreenType('TWO_D')).toBe('2D')
    expect(formatScreenType('THREE_D')).toBe('3D')
    expect(formatScreenType('IMAX')).toBe('IMAX')
    expect(formatScreenType('CUSTOM_TYPE')).toBe('CUSTOM TYPE')
    expect(formatScreenType(null)).toBe('')
    expect(formatScreenType(undefined)).toBe('')
  })
})

describe('GENRE_LABELS and formatGenre', () => {
  it('maps genres correctly to human-readable strings', () => {
    expect(GENRE_LABELS.SCIENCE_FICTION).toBe('Science Fiction')
    expect(GENRE_LABELS.ACTION).toBe('Action')
    expect(GENRE_LABELS.ANIMATION).toBe('Animation')
    expect(GENRE_LABELS.COMEDY).toBe('Comedy')
    expect(GENRE_LABELS.DRAMA).toBe('Drama')
    expect(GENRE_LABELS.HORROR).toBe('Horror')
    expect(GENRE_LABELS.ROMANCE).toBe('Romance')
    expect(GENRE_LABELS.THRILLER).toBe('Thriller')
  })

  it('formats genres using helper', () => {
    expect(formatGenre('SCIENCE_FICTION')).toBe('Science Fiction')
    expect(formatGenre('ACTION')).toBe('Action')
    expect(formatGenre('MYSTERY_ADVENTURE')).toBe('MYSTERY ADVENTURE')
    expect(formatGenre(null)).toBe('')
    expect(formatGenre(undefined)).toBe('')
  })
})
