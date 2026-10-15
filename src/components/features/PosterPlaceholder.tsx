import React from 'react'
import {
  Clapperboard,
  Film,
  Flame,
  Ghost,
  Heart,
  Laugh,
  Rocket,
  Sparkles,
  Zap,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { formatGenre } from '@/lib/labels'
import { cn } from '@/lib/utils'

interface PosterPlaceholderProps {
  title: string
  movieId?: string
  genre?: string
  certificate?: string
  className?: string
  aspectRatio?: 'poster' | 'banner' | 'square'
}

const PALETTES = [
  'from-rose-950 via-neutral-900 to-black',
  'from-amber-950 via-neutral-900 to-stone-950',
  'from-indigo-950 via-slate-900 to-black',
  'from-red-950 via-zinc-900 to-neutral-950',
  'from-emerald-950 via-neutral-900 to-black',
  'from-purple-950 via-stone-900 to-black',
  'from-cyan-950 via-slate-900 to-neutral-950',
]

function getGenreIcon(genre?: string) {
  const g = genre?.toUpperCase()
  switch (g) {
    case 'ACTION':
      return Flame
    case 'ANIMATION':
      return Sparkles
    case 'COMEDY':
      return Laugh
    case 'DRAMA':
      return Film
    case 'HORROR':
      return Ghost
    case 'ROMANCE':
      return Heart
    case 'SCIENCE_FICTION':
      return Rocket
    case 'THRILLER':
      return Zap
    default:
      return Clapperboard
  }
}

function stringToHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function PosterPlaceholder({
  title,
  movieId,
  genre,
  certificate,
  className,
  aspectRatio = 'poster',
}: PosterPlaceholderProps) {
  const hashKey = movieId || title || 'cinebook'
  const hash = stringToHash(hashKey)
  const gradient = PALETTES[hash % PALETTES.length]
  const GenreIcon = getGenreIcon(genre)

  const words = title.trim().split(/\s+/)
  const initials =
    words.length > 1
      ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase()
      : (title.slice(0, 2) || 'CB').toUpperCase()

  const ratioClass =
    aspectRatio === 'poster'
      ? 'aspect-[2/3]'
      : aspectRatio === 'banner'
        ? 'aspect-[21/9]'
        : 'aspect-square'

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between overflow-hidden rounded-md bg-gradient-to-br p-4 text-white shadow-inner select-none',
        gradient,
        ratioClass,
        className,
      )}
      aria-hidden="true"
    >
      {/* Subtle geometric cinema light watermark overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-60" />
      <div className="pointer-events-none absolute -right-6 -bottom-6 text-white/5 font-black text-8xl tracking-tighter">
        {initials}
      </div>

      {/* Top row: certificate & genre icon */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {certificate ? (
          <Badge
            variant="outline"
            className="border-white/20 bg-black/40 text-xs font-semibold tracking-wider text-white backdrop-blur-xs"
          >
            {certificate}
          </Badge>
        ) : (
          <div />
        )}
        <div className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-xs">
          {React.createElement(GenreIcon, { className: 'size-4' })}
        </div>
      </div>

      {/* Center: monogram */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
        <span className="font-serif text-3xl font-extrabold tracking-widest text-white/80 drop-shadow-md sm:text-4xl">
          {initials}
        </span>
        {genre && (
          <span className="mt-1 text-xs font-medium tracking-widest uppercase text-white/60">
            {formatGenre(genre)}
          </span>
        )}
      </div>

      {/* Bottom bar indicator */}
      <div className="relative z-10 h-1 w-8 rounded-full bg-primary/70" />
    </div>
  )
}
