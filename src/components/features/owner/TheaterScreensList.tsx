import { Link } from 'react-router-dom'
import { Armchair } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CopyIdButton, EmptyState } from '@/components/features'
import { formatScreenType } from '@/lib/labels'
import type { RecentScreen } from '@/store/recent.store'

interface TheaterScreensListProps {
  screens: RecentScreen[]
  theaterId: string
  isForbidden: boolean
  emptyTitle: string
  emptyDescription: string
  /** Show the per-card "Add Show" / "Owner Only" actions (owner view only). */
  allowScheduling?: boolean
}

/** Grid of the screens tracked locally for a theater. */
export function TheaterScreensList({
  screens,
  theaterId,
  isForbidden,
  emptyTitle,
  emptyDescription,
  allowScheduling = false,
}: TheaterScreensListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-heading">Configured Screens</h3>
        <span className="text-xs text-muted-foreground">
          {screens.length} {screens.length === 1 ? 'screen' : 'screens'}
        </span>
      </div>

      {screens.length === 0 ? (
        <EmptyState icon={Armchair} title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {screens.map((screen) => (
            <Card
              key={screen.screenId}
              className="cinema-card-lift p-4 flex flex-col justify-between border border-border/70"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-semibold text-xs">
                    {formatScreenType(screen.screenType) || 'Screen'}
                  </Badge>
                  <CopyIdButton id={screen.screenId} label="Screen ID" size="xs" variant="ghost" />
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p className="font-semibold text-foreground">
                    {screen.capacity} seats · {screen.noOfRows} rows
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-border/40 flex items-center justify-between gap-2">
                <Button variant="outline" size="xs" asChild className="text-xs flex-1">
                  <Link to={`/screens/${screen.screenId}`}>Seat Map</Link>
                </Button>
                {allowScheduling &&
                  (isForbidden ? (
                    <Button variant="ghost" size="xs" disabled className="text-xs flex-1">
                      Owner Only
                    </Button>
                  ) : (
                    <Button size="xs" asChild className="text-xs flex-1">
                      <Link to={`/owner/screens/${screen.screenId}?theaterId=${theaterId}`}>
                        Add Show
                      </Link>
                    </Button>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
