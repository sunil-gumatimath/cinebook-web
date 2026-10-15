import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatRuntime } from '@/lib/duration'
import { formatGenre } from '@/lib/labels'
import { cn } from '@/lib/utils'

import { CopyIdButton } from './CopyIdButton'
import { PosterPlaceholder } from './PosterPlaceholder'
import { RatingStars } from './RatingStars'

interface MovieCardProps {
  movie: {
    movieId: string
    title?: string
    genre?: string
    certificate?: string
    runtime?: string
    ratings?: number
    description?: string
  }
  className?: string
  /** When false, the card renders as a non-clickable preview (no links, no copy button). */
  interactive?: boolean
}

export function MovieCard({ movie, className, interactive = true }: MovieCardProps) {
  const poster = (
    <PosterPlaceholder
      title={movie.title || 'Untitled'}
      movieId={movie.movieId}
      genre={movie.genre}
      certificate={movie.certificate}
      aspectRatio="poster"
    />
  )

  return (
    <Card
      className={cn(
        'group cinema-card-lift flex flex-col overflow-hidden border border-border/70 bg-card hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary',
        className,
      )}
    >
      {interactive ? (
        <Link
          to={`/movies/${movie.movieId}`}
          className="block focus:outline-hidden"
          tabIndex={-1}
          aria-hidden="true"
        >
          {poster}
        </Link>
      ) : (
        <div aria-hidden="true">{poster}</div>
      )}

      <div className="flex flex-1 flex-col p-4 space-y-3">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            {interactive ? (
              <Link
                to={`/movies/${movie.movieId}`}
                className="font-semibold text-base leading-snug line-clamp-1 hover:text-primary transition-colors focus-visible:outline-hidden focus-visible:underline"
              >
                {movie.title || 'Untitled'}
              </Link>
            ) : (
              <span className="font-semibold text-base leading-snug line-clamp-1">
                {movie.title || 'Untitled'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {movie.genre && (
              <Badge variant="outline" className="text-xs uppercase font-medium">
                {formatGenre(movie.genre)}
              </Badge>
            )}
            {movie.runtime && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="size-3" />
                {formatRuntime(movie.runtime)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-border/40 text-xs">
          <RatingStars value={movie.ratings ?? 0} size="sm" showText />
          {interactive && (
            <CopyIdButton id={movie.movieId} label="Movie ID" size="xs" variant="ghost" />
          )}
        </div>
      </div>
    </Card>
  )
}
