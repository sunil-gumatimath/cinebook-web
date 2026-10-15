import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  ShieldAlert,
} from 'lucide-react'

import { ApiError, theatersApi } from '@/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopyIdButton, EmptyState, PageHeader } from '@/components/features'
import {
  AddScreenForm,
  TheaterDetailsForm,
  TheaterScreensList,
} from '@/components/features/owner'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/lib/title'
import { useRecentStore } from '@/store/recent.store'
import type { TheaterResponse } from '@/types/api'

// BACKEND-GAP: GET /theater/{id}/screens to list owned screens

export function OwnerTheaterManagePage() {
  const { theaterId } = useParams<{ theaterId: string }>()
  const theaters = useRecentStore((s) => s.theaters)
  const screens = useRecentStore((s) => s.screens)
  const saveTheater = useRecentStore((s) => s.saveTheater)
  const setTheaterSource = useRecentStore((s) => s.setTheaterSource)

  const knownTheater = theaters.find((t) => t.theaterId === theaterId)
  const isOwner = knownTheater?.source === 'created'

  const [activeTab, setActiveTab] = useState('screens')
  const [isForbidden, setIsForbidden] = useState(false)

  // Fetch Theater Details
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

  useDocumentTitle(theater ? `Manage: ${theater.name}` : 'Manage Theater')

  // Keep the local recent-store entry in sync with the loaded theater.
  useEffect(() => {
    if (theater) {
      saveTheater({
        theaterId: theater.theaterId,
        name: theater.name,
        city: theater.city,
        address: theater.address,
        landmark: theater.landmark,
        source: knownTheater?.source ?? 'opened',
      })
    }
  }, [theater, saveTheater, knownTheater?.source])

  // The backend has no "my theaters" endpoint, so ownership of a theater opened by ID
  // can't be known up front. Let the owner opt in; a 403 on the first write reverts it.
  const enableManagement = () => {
    if (!theaterId) return
    setIsForbidden(false)
    setTheaterSource(theaterId, 'created')
  }

  const revokeManagement = () => {
    if (!theaterId) return
    setIsForbidden(true)
    setTheaterSource(theaterId, 'opened')
  }

  const handleTheaterUpdated = (updated: TheaterResponse) => {
    saveTheater({
      theaterId: updated.theaterId,
      name: updated.name,
      city: updated.city,
      address: updated.address,
      landmark: updated.landmark,
      source: 'created',
    })
    setIsForbidden(false)
    void refetch()
  }

  // Filter known screens for this theater from recent store
  const theaterScreens = screens.filter((s) => s.theaterId === theaterId)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    )
  }

  // Handle 403 Forbidden (not owner) or 404
  if (error || !theater) {
    const is403 = error instanceof ApiError && error.isForbidden
    const is404 = error instanceof ApiError && error.isNotFound

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
          title={is403 ? 'Access Denied' : is404 ? 'Theater Not Found' : 'Error Loading Theater'}
          description={
            is403
              ? 'You do not own this theater. Only the theater owner who registered it can manage its details and auditoriums.'
              : is404
                ? `Theater with ID "${theaterId}" was not found.`
                : error instanceof Error
                  ? error.message
                  : 'An error occurred.'
          }
          action={
            <Button size="sm" asChild>
              <Link to="/owner">Return to Owner Dashboard</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Manage: ${theater.name}`}
        description="Configure venue details, auditoriums, and schedule shows."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Owner Dashboard', href: '/owner' },
          { label: theater.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <CopyIdButton id={theater.theaterId} label="Theater ID" variant="outline" size="sm" />
            <Button size="sm" variant="ghost" asChild className="gap-1.5">
              <Link to={`/theaters/${theater.theaterId}`}>
                <Eye className="size-3.5" />
                <span>View Public Page</span>
              </Link>
            </Button>
          </div>
        }
      />

      {!isOwner ? (
        <div className="space-y-6">
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <Eye className="size-4" />
                <span>View Only</span>
              </div>
              <CardTitle className="text-xl font-bold font-heading">Read-Only Theater</CardTitle>
              <CardDescription className="text-xs">
                Opened for viewing. If you own this theater, enable management to add screens and
                update its details. Only the registered owner can save changes.
              </CardDescription>
            </CardHeader>
            {isForbidden && (
              <CardContent>
                <div
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2"
                >
                  <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                  <span>
                    You don't own this theater, so management was turned off. Only the owner who
                    registered it can modify it.
                  </span>
                </div>
              </CardContent>
            )}
            <CardFooter className="flex flex-wrap gap-2">
              <Button size="sm" onClick={enableManagement} className="gap-1.5">
                <CheckCircle2 className="size-3.5" />
                <span>I own this theater — enable management</span>
              </Button>
              <Button size="sm" variant="outline" asChild className="gap-1.5">
                <Link to={`/theaters/${theater.theaterId}`}>
                  <Eye className="size-3.5" />
                  <span>Go to Public Theater Page</span>
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <TheaterScreensList
            screens={theaterScreens}
            theaterId={theater.theaterId}
            isForbidden={isForbidden}
            emptyTitle="No screens recorded"
            emptyDescription="Screens configured for this theater on this device will appear here."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {isForbidden && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive flex items-start gap-2.5"
            >
              <ShieldAlert className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Access Denied</p>
                <p>
                  You do not own this theater. Only the theater owner who created it can modify
                  details, add auditoriums, or schedule shows.
                </p>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-sm">
              <TabsTrigger value="screens" className="text-xs">
                Auditoriums & Screens
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs">
                Edit Theater Info
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Screens Management */}
            <TabsContent value="screens" className="space-y-8">
              <AddScreenForm
                theaterId={theater.theaterId}
                isForbidden={isForbidden}
                onForbidden={revokeManagement}
              />

              <TheaterScreensList
                screens={theaterScreens}
                theaterId={theater.theaterId}
                isForbidden={isForbidden}
                allowScheduling
                emptyTitle="No screens created yet"
                emptyDescription="Add your first screen above to generate the seat layout and start scheduling shows."
              />
            </TabsContent>

            {/* Tab 2: Edit Theater Info */}
            <TabsContent value="details">
              <TheaterDetailsForm
                theater={theater}
                isForbidden={isForbidden}
                onForbidden={revokeManagement}
                onUpdated={handleTheaterUpdated}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
