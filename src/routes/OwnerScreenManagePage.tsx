import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react'

import { ApiError, theatersApi } from '@/api'
import { Button } from '@/components/ui/button'
import { CopyIdButton, EmptyState, PageHeader } from '@/components/features'
import {
  ScheduleShowForm,
  ScheduledShowsList,
  ScreenSeatMapCard,
} from '@/components/features/owner'
import { formatScreenType } from '@/lib/labels'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/lib/title'
import { useRecentStore } from '@/store/recent.store'
import type { ShowResponse } from '@/types/api'

// BACKEND-GAP: GET /screens/{screenId}/shows for listing scheduled shows

export function OwnerScreenManagePage() {
  const { screenId } = useParams<{ screenId: string }>()
  const [searchParams] = useSearchParams()
  const screens = useRecentStore((s) => s.screens)

  const queryTheaterId = searchParams.get('theaterId')

  // Try to find known theaterId from search param or recent screens
  const knownScreen = screens.find((s) => s.screenId === screenId)
  const initialTheaterId = queryTheaterId || knownScreen?.theaterId || ''

  const [showsCreated, setShowsCreated] = useState<ShowResponse[]>([])

  // Fetch Screen & Seats
  const {
    data: screen,
    isLoading: screenLoading,
    error: screenError,
    refetch: refetchScreen,
  } = useQuery({
    queryKey: queryKeys.screen(screenId || ''),
    queryFn: ({ signal }) => theatersApi.getScreen(screenId || '', signal),
    enabled: Boolean(screenId),
    retry: 1,
  })

  useDocumentTitle(
    screen ? `Screen ${formatScreenType(screen.screenType)} · Schedule Show` : 'Schedule Show',
  )

  if (screenLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    )
  }

  if (screenError || !screen) {
    const is403 = screenError instanceof ApiError && screenError.isForbidden
    const is404 = screenError instanceof ApiError && screenError.isNotFound

    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link to="/owner">
            <ArrowLeft className="size-4" />
            <span>Back to Dashboard</span>
          </Link>
        </Button>

        <EmptyState
          icon={is403 ? ShieldAlert : AlertCircle}
          title={is403 ? 'Access Denied' : is404 ? 'Screen Not Found' : 'Error Loading Screen'}
          description={
            is403
              ? 'You do not have permission to manage this screen.'
              : is404
                ? `Screen "${screenId}" was not found.`
                : screenError instanceof Error
                  ? screenError.message
                  : 'An error occurred.'
          }
          action={
            <Button size="sm" onClick={() => refetchScreen()}>
              Try Again
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title={`Screen ${formatScreenType(screen.screenType)}`}
        description={`Hall type: ${formatScreenType(screen.screenType)} · ${screen.capacity} seats · ${screen.noOfRows} rows.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Owner Dashboard', href: '/owner' },
          { label: `Screen ${formatScreenType(screen.screenType)}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground mr-1">
              ID: {screen.screenId.slice(0, 8)}…
            </span>
            <CopyIdButton id={screen.screenId} label="Screen ID" variant="outline" size="sm" />
            <Button size="sm" variant="ghost" asChild>
              <Link to={`/screens/${screen.screenId}`}>Public View</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left: Schedule Show Form */}
        <div className="lg:col-span-5 space-y-6">
          <ScheduleShowForm
            screenId={screen.screenId}
            queryTheaterId={queryTheaterId}
            initialTheaterId={initialTheaterId}
            onShowCreated={(show) => setShowsCreated((prev) => [show, ...prev])}
          />

          {/* Scheduled Shows in this Session */}
          <ScheduledShowsList shows={showsCreated} />
        </div>

        {/* Right: Seat Map Preview */}
        <div className="lg:col-span-7 space-y-4">
          <ScreenSeatMapCard screen={screen} />
        </div>
      </div>
    </div>
  )
}
