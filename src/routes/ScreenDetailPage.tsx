import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, CalendarPlus } from 'lucide-react'

import { ApiError, theatersApi } from '@/api'
import { Button } from '@/components/ui/button'
import {
  CopyIdButton,
  EmptyState,
  PageHeader,
  SeatMap,
} from '@/components/features'
import { formatScreenType } from '@/lib/labels'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/lib/title'
import { useAuthStore } from '@/store/auth.store'
import { useRecentStore } from '@/store/recent.store'

export function ScreenDetailPage() {
  const { screenId } = useParams<{ screenId: string }>()
  const role = useAuthStore((s) => s.role)
  const { saveScreen, removeScreen } = useRecentStore()
  const existingTheaterId = useRecentStore(
    (s) => s.screens.find((sc) => sc.screenId === screenId)?.theaterId,
  )

  const {
    data: screen,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.screen(screenId || ''),
    queryFn: ({ signal }) => theatersApi.getScreen(screenId || '', signal),
    enabled: Boolean(screenId),
    retry: 1,
  })

  useDocumentTitle(screen ? `Screen ${formatScreenType(screen.screenType)} · Seat Map` : 'Seat Map')

  useEffect(() => {
    if (screen) {
      saveScreen({
        screenId: screen.screenId,
        screenType: screen.screenType,
        capacity: screen.capacity,
        noOfRows: screen.noOfRows,
        ...(existingTheaterId ? { theaterId: existingTheaterId } : {}),
      })
    }
  }, [screen, saveScreen, existingTheaterId])

  useEffect(() => {
    if (error instanceof ApiError && error.isNotFound && screenId) {
      removeScreen(screenId)
    }
  }, [error, screenId, removeScreen])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-96 rounded-xl bg-muted" />
      </div>
    )
  }

  if (error || !screen) {
    const is404 = error instanceof ApiError && error.isNotFound
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link to="/movies">
            <ArrowLeft className="size-4" />
            <span>Back to Movies</span>
          </Link>
        </Button>

        <EmptyState
          icon={AlertCircle}
          title={is404 ? 'Screen not found' : 'Failed to load screen'}
          description={
            is404
              ? `We could not find any auditorium screen with ID: "${screenId}".`
              : (error instanceof Error ? error.message : 'An error occurred while fetching the screen.')
          }
          action={
            <Button size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Screen ${formatScreenType(screen.screenType)}`}
        description={`Hall type: ${formatScreenType(screen.screenType)} · ${screen.capacity} total capacity across ${screen.noOfRows} rows.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          ...(existingTheaterId ? [{ label: 'Theater', href: `/theaters/${existingTheaterId}` }] : []),
          { label: `Screen ${formatScreenType(screen.screenType)}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground mr-1">
              ID: {screen.screenId.slice(0, 8)}…
            </span>
            <CopyIdButton id={screen.screenId} label="Screen ID" variant="outline" size="sm" />
            {role === 'ROLE_THEATER_OWNER' && (
              <Button size="sm" variant="secondary" asChild className="gap-1.5 font-medium">
                <Link to={`/owner/screens/${screen.screenId}`}>
                  <CalendarPlus className="size-3.5" />
                  <span>Schedule Shows (Owner)</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Interactive Seat Map Card */}
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-8 shadow-xs">
        <SeatMap
          screenId={screen.screenId}
          screenType={screen.screenType}
          capacity={screen.capacity}
          noOfRows={screen.noOfRows}
          seatResponses={screen.seatResponses || []}
        />
      </div>
    </div>
  )
}
