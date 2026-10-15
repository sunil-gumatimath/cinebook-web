import { useEffect, useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertCircle,
  Armchair,
  ArrowLeft,
  CheckCircle2,
  Edit,
  Eye,
  Plus,
  Save,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, setFormServerErrors, theatersApi } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopyIdButton, EmptyState, PageHeader } from '@/components/features'
import { formatScreenType } from '@/lib/labels'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/lib/title'
import { useRecentStore } from '@/store/recent.store'
import type { ScreenRequest, TheaterRequest } from '@/types/api'
import { SCREEN_TYPES } from '@/types/api'

// BACKEND-GAP: GET /theater/{id}/screens to list owned screens (see docs/BACKEND_GAPS.md)

const theaterEditSchema = z.object({
  name: z.string().trim().min(1, 'Theater name cannot be blank'),
  address: z.string().trim().min(1, 'Address cannot be blank'),
  city: z.string().trim().min(1, 'City cannot be blank'),
  landmark: z.string().trim().min(1, 'Landmark cannot be blank'),
})

type TheaterEditValues = z.infer<typeof theaterEditSchema>

const addScreenSchema = z
  .object({
    screenType: z.enum(SCREEN_TYPES, { message: 'Select a valid screen type' }),
    capacity: z
      .number()
      .min(1, 'Capacity must be at least 1')
      .max(1000, 'Capacity cannot exceed 1000'),
    noOfRows: z
      .number()
      .min(1, 'Rows must be at least 1')
      .max(26, 'Rows cannot exceed 26 (A to Z)'),
  })
  .refine((data) => data.capacity % data.noOfRows === 0, {
    message: 'Capacity must be evenly divisible by number of rows',
    path: ['capacity'],
  })

type AddScreenValues = z.infer<typeof addScreenSchema>

export function OwnerTheaterManagePage() {
  const { theaterId } = useParams<{ theaterId: string }>()
  const { theaters, screens, saveTheater, saveScreen, setTheaterSource } = useRecentStore()

  const knownTheater = theaters.find((t) => t.theaterId === theaterId)
  const isOwner = knownTheater?.source === 'created'

  const [activeTab, setActiveTab] = useState('screens')
  const [isUpdatingTheater, setIsUpdatingTheater] = useState(false)
  const [theaterUpdateError, setTheaterUpdateError] = useState<string | null>(null)

  const [isAddingScreen, setIsAddingScreen] = useState(false)
  const [screenAddError, setScreenAddError] = useState<string | null>(null)
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

  // Update theater form
  const {
    register: registerTheater,
    handleSubmit: handleSubmitTheater,
    reset: resetTheaterForm,
    setError: setTheaterError,
    formState: { errors: theaterErrors },
  } = useForm<TheaterEditValues>({
    resolver: zodResolver(theaterEditSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      landmark: '',
    },
  })

  // Prefill form when theater data is loaded
  useEffect(() => {
    if (theater) {
      resetTheaterForm({
        name: theater.name,
        address: theater.address,
        city: theater.city,
        landmark: theater.landmark,
      })
      saveTheater({
        theaterId: theater.theaterId,
        name: theater.name,
        city: theater.city,
        address: theater.address,
        landmark: theater.landmark,
        source: knownTheater?.source ?? 'opened',
      })
    }
  }, [theater, resetTheaterForm, saveTheater, knownTheater?.source])

  // Add screen form
  const {
    register: registerScreen,
    handleSubmit: handleSubmitScreen,
    control: screenControl,
    setValue: setScreenValue,
    reset: resetScreenForm,
    setError: setScreenErrorRHF,
    formState: { errors: screenErrors },
  } = useForm<AddScreenValues>({
    resolver: zodResolver(addScreenSchema),
    defaultValues: {
      screenType: 'TWO_D',
      capacity: 120,
      noOfRows: 10,
    },
  })

  const watchedType = useWatch({ control: screenControl, name: 'screenType' })
  const watchedCapacity = Number(useWatch({ control: screenControl, name: 'capacity' })) || 0
  const watchedRows = Number(useWatch({ control: screenControl, name: 'noOfRows' })) || 0

  const seatsPerRow =
    watchedRows > 0 && watchedCapacity > 0 && watchedCapacity % watchedRows === 0
      ? Math.floor(watchedCapacity / watchedRows)
      : null

  // The backend has no "my theaters" endpoint, so ownership of a theater opened by ID
  // can't be known up front. Let the owner opt in; a 403 on the first write reverts it.
  const enableManagement = () => {
    if (!theaterId) return
    setIsForbidden(false)
    setTheaterUpdateError(null)
    setScreenAddError(null)
    setTheaterSource(theaterId, 'created')
  }

  const revokeManagement = () => {
    if (!theaterId) return
    setIsForbidden(true)
    setTheaterSource(theaterId, 'opened')
  }

  // Save updated theater
  const onUpdateTheater = async (values: TheaterEditValues) => {
    if (!theaterId) return
    setIsUpdatingTheater(true)
    setTheaterUpdateError(null)

    try {
      const payload: TheaterRequest = {
        name: values.name.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        landmark: values.landmark.trim(),
      }

      const res = await theatersApi.update(theaterId, payload)
      saveTheater({
        theaterId: res.theaterId,
        name: res.name,
        city: res.city,
        address: res.address,
        landmark: res.landmark,
        source: 'created',
      })
      setIsForbidden(false)
      toast.success('Theater details updated successfully!')
      refetch()
    } catch (err) {
      if (err instanceof ApiError && err.isForbidden) {
        revokeManagement()
        setTheaterUpdateError("You don't own this theater. Only the theater owner can edit its details.")
      } else {
        const msg = setFormServerErrors(err, setTheaterError)
        setTheaterUpdateError(msg || 'Failed to update theater.')
      }
    } finally {
      setIsUpdatingTheater(false)
    }
  }

  // Create new screen
  const onAddScreen = async (values: AddScreenValues) => {
    if (!theaterId) return
    setIsAddingScreen(true)
    setScreenAddError(null)

    try {
      const payload: ScreenRequest = {
        screenType: values.screenType,
        capacity: values.capacity,
        noOfRows: values.noOfRows,
      }

      const res = await theatersApi.addScreen(theaterId, payload)
      saveScreen({
        screenId: res.screenId,
        theaterId,
        screenType: res.screenType,
        capacity: res.capacity,
        noOfRows: res.noOfRows,
      })

      toast.success(`Screen ${res.screenType} (${res.capacity} seats) created!`)
      resetScreenForm({
        screenType: 'TWO_D',
        capacity: 120,
        noOfRows: 10,
      })
    } catch (err) {
      if (err instanceof ApiError && err.isForbidden) {
        revokeManagement()
        setScreenAddError("You don't own this theater. Only the theater owner can add screens.")
      } else {
        const msg = setFormServerErrors(err, setScreenErrorRHF)
        setScreenAddError(msg || 'Failed to create screen.')
      }
    } finally {
      setIsAddingScreen(false)
    }
  }

  // Filter known screens for this theater from recent store
  const theaterScreens = screens.filter((s) => s.theaterId === theaterId)

  const editNameId = useId()
  const editAddressId = useId()
  const editCityId = useId()
  const editLandmarkId = useId()

  const capacityId = useId()
  const rowsId = useId()

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
              ? "You do not own this theater. Only the theater owner who registered it can manage its details and auditoriums."
              : is404
                ? `Theater with ID "${theaterId}" was not found.`
                : (error instanceof Error ? error.message : 'An error occurred.')
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
        description={`Configure venue details, auditoriums, and schedule shows.`}
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
              <CardTitle className="text-xl font-bold font-heading">
                Read-Only Theater
              </CardTitle>
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

          {/* List of Screens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading">Configured Screens</h3>
              <span className="text-xs text-muted-foreground">
                {theaterScreens.length} {theaterScreens.length === 1 ? 'screen' : 'screens'}
              </span>
            </div>

            {theaterScreens.length === 0 ? (
              <EmptyState
                icon={Armchair}
                title="No screens recorded"
                description="Screens configured for this theater on this device will appear here."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {theaterScreens.map((screen) => (
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
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
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
                  You do not own this theater. Only the theater owner who created it can modify details,
                  add auditoriums, or schedule shows.
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
              {/* Add Screen Form */}
              <Card className="border border-border/80 shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
                    <Plus className="size-4" />
                    <span>New Auditorium</span>
                  </div>
                  <CardTitle className="text-xl font-bold font-heading">Add Screen</CardTitle>
                  <CardDescription className="text-xs">
                    Configure screen type and layout. Rows will be lettered from A to Z; seats per row
                    must divide capacity evenly.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmitScreen(onAddScreen)} noValidate>
                  <CardContent className="space-y-5">
                    {screenAddError && (
                      <div
                        role="alert"
                        className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                      >
                        {screenAddError}
                      </div>
                    )}

                    <fieldset disabled={isForbidden} className="space-y-5 disabled:opacity-60">
                  {/* Segmented Screen Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Screen Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SCREEN_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setScreenValue('screenType', type, { shouldValidate: true })}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all select-none ${
                          watchedType === type
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        <Armchair className="size-4 mb-1" />
                        <span>{formatScreenType(type)}</span>
                      </button>
                    ))}
                  </div>
                  {screenErrors.screenType && (
                    <p className="text-xs text-destructive">{screenErrors.screenType.message}</p>
                  )}
                </div>

                {/* Capacity & Rows */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={capacityId}>Total Capacity (1–1000)</Label>
                    <Input
                      id={capacityId}
                      type="number"
                      min={1}
                      max={1000}
                      aria-invalid={screenErrors.capacity !== undefined}
                      {...registerScreen('capacity', { valueAsNumber: true })}
                    />
                    {screenErrors.capacity && (
                      <p className="text-xs text-destructive">{screenErrors.capacity.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={rowsId}>Number of Rows (1–26, A–Z)</Label>
                    <Input
                      id={rowsId}
                      type="number"
                      min={1}
                      max={26}
                      aria-invalid={screenErrors.noOfRows !== undefined}
                      {...registerScreen('noOfRows', { valueAsNumber: true })}
                    />
                    {screenErrors.noOfRows && (
                      <p className="text-xs text-destructive">{screenErrors.noOfRows.message}</p>
                    )}
                  </div>
                </div>

                {/* Live Preview Info & Mini Grid */}
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Layout Calculation:</span>
                    <span className="font-semibold text-foreground">
                      {seatsPerRow !== null ? (
                        <span className="text-emerald-500 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="size-3.5" />
                          <span>
                            {watchedCapacity} seats = {watchedRows} rows × {seatsPerRow} seats/row
                          </span>
                        </span>
                      ) : (
                        <span className="text-destructive font-mono">
                          Capacity must divide rows evenly
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Mini seat-grid preview */}
                  {seatsPerRow !== null && watchedRows > 0 && (
                    <div className="pt-2 border-t border-border/40">
                      <p className="text-xs text-muted-foreground pb-2 text-center uppercase tracking-wider font-semibold">
                        Mini Grid Preview
                      </p>
                      <div className="flex flex-col items-center gap-1 overflow-x-auto p-2">
                        {Array.from({ length: Math.min(watchedRows, 6) }, (_, rIdx) => (
                          <div key={rIdx} className="flex items-center gap-1">
                            <span className="font-mono text-xs text-muted-foreground w-3 text-right">
                              {String.fromCharCode(65 + rIdx)}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: Math.min(seatsPerRow, 16) }, (_, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="size-2 rounded-xs bg-primary/40 border border-primary/60"
                                />
                              ))}
                              {seatsPerRow > 16 && (
                                <span className="text-xs text-muted-foreground px-1">…</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {watchedRows > 6 && (
                          <span className="text-xs text-muted-foreground">
                            + {watchedRows - 6} more rows…
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </fieldset>
            </CardContent>

              <CardFooter className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAddingScreen || seatsPerRow === null || isForbidden}
                  className="gap-2"
                >
                  <Plus className="size-4" />
                  <span>{isAddingScreen ? 'Creating Screen…' : 'Create Screen'}</span>
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* List of Screens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading">Configured Screens</h3>
              <span className="text-xs text-muted-foreground">
                {theaterScreens.length} {theaterScreens.length === 1 ? 'screen' : 'screens'}
              </span>
            </div>

            {theaterScreens.length === 0 ? (
              <EmptyState
                icon={Armchair}
                title="No screens created yet"
                description="Add your first screen above to generate the seat layout and start scheduling shows."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {theaterScreens.map((screen) => (
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
                      {isForbidden ? (
                        <Button variant="ghost" size="xs" disabled className="text-xs flex-1">
                          Owner Only
                        </Button>
                      ) : (
                        <Button size="xs" asChild className="text-xs flex-1">
                          <Link to={`/owner/screens/${screen.screenId}?theaterId=${theater.theaterId}`}>
                            Add Show
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Edit Theater Info */}
        <TabsContent value="details">
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
                <Edit className="size-4" />
                <span>Full Update</span>
              </div>
              <CardTitle className="text-xl font-bold font-heading">
                Edit Theater Information
              </CardTitle>
              <CardDescription className="text-xs">
                Update venue name, street address, city, and landmark. All four fields are required.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmitTheater(onUpdateTheater)} noValidate>
              <CardContent className="space-y-4">
                {theaterUpdateError && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                  >
                    {theaterUpdateError}
                  </div>
                )}

                <fieldset disabled={isForbidden} className="space-y-4 disabled:opacity-60">
                  <div className="space-y-1.5">
                    <Label htmlFor={editNameId}>Theater Name</Label>
                    <Input
                      id={editNameId}
                      aria-invalid={theaterErrors.name !== undefined}
                      {...registerTheater('name')}
                    />
                    {theaterErrors.name && (
                      <p className="text-xs text-destructive">{theaterErrors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={editAddressId}>Street Address</Label>
                    <Input
                      id={editAddressId}
                      aria-invalid={theaterErrors.address !== undefined}
                      {...registerTheater('address')}
                    />
                    {theaterErrors.address && (
                      <p className="text-xs text-destructive">{theaterErrors.address.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={editCityId}>City</Label>
                    <Input
                      id={editCityId}
                      aria-invalid={theaterErrors.city !== undefined}
                      {...registerTheater('city')}
                    />
                    {theaterErrors.city && (
                      <p className="text-xs text-destructive">{theaterErrors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={editLandmarkId}>Landmark</Label>
                    <Input
                      id={editLandmarkId}
                      aria-invalid={theaterErrors.landmark !== undefined}
                      {...registerTheater('landmark')}
                    />
                    {theaterErrors.landmark && (
                      <p className="text-xs text-destructive">{theaterErrors.landmark.message}</p>
                    )}
                  </div>
                </fieldset>
              </CardContent>

              <CardFooter className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdatingTheater || isForbidden}
                  className="gap-2"
                >
                  <Save className="size-4" />
                  <span>{isUpdatingTheater ? 'Saving…' : 'Save Changes'}</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )}
</div>
  )
}
