import { Badge } from '@/components/ui/badge'
import { SeatMap } from '@/components/features'
import type { ScreenDetailResponse } from '@/types/api'

interface ScreenSeatMapCardProps {
  screen: ScreenDetailResponse
}

/** Read-only auditorium layout preview for the owner screen page. */
export function ScreenSeatMapCard({ screen }: ScreenSeatMapCardProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold font-heading">Auditorium Layout</h3>
        <Badge variant="outline" className="text-xs font-mono">
          {screen.capacity} Seats
        </Badge>
      </div>

      <SeatMap
        screenType={screen.screenType}
        capacity={screen.capacity}
        noOfRows={screen.noOfRows}
        seatResponses={screen.seatResponses || []}
      />
    </div>
  )
}
