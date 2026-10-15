import { format } from 'date-fns'
import { Calendar, Clock } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { CopyIdButton } from '@/components/features'
import type { ShowResponse } from '@/types/api'

interface ScheduledShowsListProps {
  shows: ShowResponse[]
}

/** Shows created during this browser session (the backend has no list endpoint). */
export function ScheduledShowsList({ shows }: ScheduledShowsListProps) {
  if (shows.length === 0) return null

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Scheduled Shows in this Session ({shows.length})
      </h4>
      <div className="space-y-2">
        {shows.map((show) => (
          <Card key={show.showId} className="border border-border/80 p-3.5 text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground text-sm">{show.movieTitle}</p>
                <p className="text-muted-foreground">{show.theaterName}</p>
              </div>
              <CopyIdButton id={show.showId} label="Show ID" size="xs" variant="ghost" />
            </div>

            <div className="flex items-center gap-3 text-muted-foreground text-xs pt-1 border-t border-border/40 tabular-nums">
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span>{format(new Date(show.startTimeEpochMillis), 'PP')}</span>
              </div>
              <div className="flex items-center gap-1 font-medium text-foreground">
                <Clock className="size-3" />
                <span>
                  {format(new Date(show.startTimeEpochMillis), 'p')} –{' '}
                  {format(new Date(show.endTimeEpochMillis), 'p')}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
