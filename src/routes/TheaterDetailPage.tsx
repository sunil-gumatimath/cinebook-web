import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Armchair,
  ArrowLeft,
  Building,
  Edit,
  MapPin,
  Navigation,
} from 'lucide-react'

import { ApiError, theatersApi } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CopyIdButton,
  EmptyState,
  IdLookup,
  PageHeader,
} from '@/components/features'
import { formatScreenType } from '@/lib/labels'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/lib/title'
import { useAuthStore } from '@/store/auth.store'
import { useRecentStore } from '@/store/recent.store'

// BACKEND-GAP: GET /theater/{id} does not return screens or owner (see docs/BACKEND_GAPS.md)

export function TheaterDetailPage() {
  const { theaterId } = useParams<{ theaterId: string }>()
  const navigate = useNavigate()
  const { role } = useAuthStore()
  const { theaters, screens, saveTheater, removeTheater } = useRecentStore()

  const knownTheater = theaters.find((t) => t.theaterId === theaterId)
  const isOwner = role === 'ROLE_THEATER_OWNER' && knownTheater?.source === 'created'

  const {
    data: theater,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.theater(theaterId || ''),
    queryFn: ({ signal }) => theatersApi.getById(theaterId || '', signal),
    enabled: Boolean(theaterId),
    retry: 1,
  })

  useDocumentTitle(theater ? theater.name : 'Theater Details')

  useEffect(() => {
    if (theater) {
      saveTheater({
        theaterId: theater.theaterId,
        name: theater.name,
        city: theater.city,
        address: theater.address,
        landmark: theater.landmark,
        source: 'opened',
      })
    }
  }, [theater, saveTheater])

  useEffect(() => {
    if (error instanceof ApiError && error.isNotFound && theaterId) {
      removeTheater(theaterId)
    }
  }, [error, theaterId, removeTheater])

  // Filter known screens for this theater from recent store
  const relatedScreens = screens.filter((s) => s.theaterId === theaterId)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-44 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    )
  }

  if (error || !theater) {
    const is404 = error instanceof ApiError && error.isNotFound
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link to="/">
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>
        </Button>

        <EmptyState
          icon={AlertCircle}
          title={is404 ? 'Theater not found' : 'Failed to load theater'}
          description={
            is404
              ? `We could not find any theater with ID: "${theaterId}".`
              : (error instanceof Error ? error.message : 'An error occurred while fetching the theater.')
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
        title={theater.name}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Theaters' },
          { label: theater.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <CopyIdButton id={theater.theaterId} label="Theater ID" variant="outline" size="sm" />
            {isOwner && (
              <Button size="sm" variant="secondary" asChild className="gap-1.5 font-medium">
                <Link to={`/owner/theaters/${theater.theaterId}`}>
                  <Edit className="size-3.5" />
                  <span>Manage Theater</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Theater Info Card */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
            <Building className="size-4" />
            <span>Cinema Venue</span>
          </div>
          <CardTitle className="text-2xl font-bold font-heading">{theater.name}</CardTitle>
          <CardDescription className="text-xs">
            Theater location and venue details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="flex items-start gap-2.5">
              <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Address</p>
                <p className="text-foreground font-medium">{theater.address}</p>
                <p className="text-xs text-muted-foreground">{theater.city}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Navigation className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Landmark</p>
                <p className="text-foreground font-medium">{theater.landmark}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screen navigation & lookup */}
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Armchair className="size-5 text-primary" />
            <h3 className="text-xl font-bold font-heading">Auditoriums & Screens</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            View screen configurations and seat maps for this venue.
          </p>
        </div>

        {/* Open Screen by ID */}
        <div className="max-w-md">
          <IdLookup
            label="Open Screen by ID"
            placeholder="Paste Screen UUID (e.g. screen-123)..."
            buttonText="View Seat Map"
            onLookup={(screenId) => navigate(`/screens/${screenId}`)}
          />
        </div>

        {/* Known Screens from Recent Store */}
        {relatedScreens.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Screens ({relatedScreens.length})
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {relatedScreens.map((screen) => (
                <Card
                  key={screen.screenId}
                  className="cinema-card-lift p-4 flex flex-col justify-between gap-3 border border-border/70 hover:border-primary/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {formatScreenType(screen.screenType) || 'Screen'}
                      </Badge>
                      <CopyIdButton id={screen.screenId} label="Screen ID" size="xs" variant="ghost" />
                    </div>
                    {screen.capacity && screen.noOfRows && (
                      <p className="text-xs text-muted-foreground">
                        {screen.capacity} seats · {screen.noOfRows} rows
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild className="flex-1 text-xs gap-1.5">
                      <Link to={`/screens/${screen.screenId}`}>
                        <Armchair className="size-3.5" />
                        <span>View Seat Map</span>
                      </Link>
                    </Button>
                    {isOwner && (
                      <Button size="sm" variant="secondary" asChild className="text-xs">
                        <Link to={`/owner/screens/${screen.screenId}?theaterId=${theater.theaterId}`}>
                          Add Show
                        </Link>
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
