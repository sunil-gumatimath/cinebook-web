import type { Genre, ScreenType } from '@/types/api'

export const SCREEN_TYPE_LABELS: Record<ScreenType, string> = {
  TWO_D: '2D',
  THREE_D: '3D',
  IMAX: 'IMAX',
}

export const GENRE_LABELS: Record<Genre, string> = {
  ACTION: 'Action',
  ANIMATION: 'Animation',
  COMEDY: 'Comedy',
  DRAMA: 'Drama',
  HORROR: 'Horror',
  ROMANCE: 'Romance',
  SCIENCE_FICTION: 'Science Fiction',
  THRILLER: 'Thriller',
}

export function formatScreenType(type: ScreenType | string | null | undefined): string {
  if (!type) return ''
  return SCREEN_TYPE_LABELS[type as ScreenType] ?? type.replace(/_/g, ' ')
}

export function formatGenre(genre: Genre | string | null | undefined): string {
  if (!genre) return ''
  return GENRE_LABELS[genre as Genre] ?? genre.replace(/_/g, ' ')
}
