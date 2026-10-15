import { useId, useState, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarPlus,
  Clock,
  Lock,
  Search,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, moviesApi, setFormServerErrors, theatersApi } from '@/api'
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
import {
  CopyIdButton,
  EmptyState,
  PageHeader,
  PosterPlaceholder,
  SeatMap,
} from '@/components/features'
import { isPastEpochMillis } from '@/lib/date'
import { formatRuntime, parseIsoDuration } from '@/lib/duration'
import { formatScreenType } from '@/lib/labels'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/lib/title'
import { useRecentStore } from '@/store/recent.store'
import type { MovieResponse, ShowRequest, ShowResponse } from '@/types/api'

// BACKEND-GAP: GET /screens/{screenId}/shows for listing scheduled shows (see docs/BACKEND_GAPS.md)

const showSchema = z.object({
  theaterId: z.string().trim().min(1, 'Theater ID is required'),
  movieId: z.string().trim().min(1, 'Movie ID is required'),
  startDateTime: z.string().min(1, 'Show date and time are required'),
})

type ShowFormValues = z.infer<typeof showSchema>

export function OwnerScreenManagePage() {
  const { screenId } = useParams<{ screenId: string }>()
  const [searchParams] = useSearchParams()
  const { screens, setTheaterSource } = useRecentStore()

  const queryTheaterId = searchParams.get('theaterId')
  const isTheaterLocked = Boolean(queryTheaterId)

  // Try to find known theaterId from search param or recent screens
  const knownScreen = screens.find((s) => s.screenId === screenId)
  const initialTheaterId = queryTheaterId || knownScreen?.theaterId || ''

  const [showsCreated, setShowsCreated] = useState<ShowResponse[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isForbidden, setIsForbidden] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Theater lookup state when not locked
  const [theaterLookupName, setTheaterLookupName] = useState<string | null>(null)
  const [theaterLookupLoading, setTheaterLookupLoading] = useState(false)
  const [theaterLookupError, setTheaterLookupError] = useState<string | null>(null)

  // Movie preview lookup state
  const [movieLookupId, setMovieLookupId] = useState('')
  const [previewMovie, setPreviewMovie] = useState<MovieResponse | null>(null)
  const [movieLookupLoading, setMovieLookupLoading] = useState(false)
  const [movieLookupError, setMovieLookupError] = useState<string | null>(null)

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

  useDocumentTitle(screen ? `Screen ${formatScreenType(screen.screenType)} · Schedule Show` : 'Schedule Show')

  const theaterIdInputId = useId()
  const movieIdInputId = useId()
  const dateTimeInputId = useId()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors },
  } = useForm<ShowFormValues>({
    resolver: zodResolver(showSchema),
    defaultValues: {
      theaterId: initialTheaterId,
      movieId: '',
      startDateTime: '',
    },
  })

  const watchedTheaterId = useWatch({ control, name: 'theaterId' })
  const watchedMovieId = useWatch({ control, name: 'movieId' })
  const watchedStartDateTime = useWatch({ control, name: 'startDateTime' })

  useEffect(() => {
    if (queryTheaterId) {
      setValue('theaterId', queryTheaterId, { shouldValidate: true })
    }
  }, [queryTheaterId, setValue])

  // Validate theater when entered manually
  const handleLookupTheater = async (id: string) => {
    const trimmed = id.trim()
    if (!trimmed) return
    setTheaterLookupLoading(true)
    setTheaterLookupError(null)
    setTheaterLookupName(null)
    try {
      const res = await theatersApi.getById(trimmed)
      setTheaterLookupName(res.name)
      setValue('theaterId', res.theaterId, { shouldValidate: true })
      toast.success(`Validated theater: ${res.name}`)
    } catch (err) {
      setTheaterLookupName(null)
      setTheaterLookupError(
        err instanceof ApiError && err.isNotFound
          ? 'Theater with this ID does not exist.'
          : 'Failed to validate theater.',
      )
    } finally {
      setTheaterLookupLoading(false)
    }
  }

  // Auto-lookup movie when ID changes
  const handleLookupMovie = async (idToLookup: string) => {
    const trimmed = idToLookup.trim()
    if (!trimmed) {
      setPreviewMovie(null)
      setMovieLookupError(null)
      return
    }

    setMovieLookupLoading(true)
    setMovieLookupError(null)

    try {
      const data = await moviesApi.getById(trimmed)
      setPreviewMovie(data)
      setValue('movieId', data.movieId, { shouldValidate: true })
      toast.success(`Loaded movie: ${data.title}`)
    } catch (err) {
      setPreviewMovie(null)
      setMovieLookupError(
        err instanceof ApiError && err.isNotFound
          ? 'Movie with this ID was not found.'
          : 'Failed to look up movie.',
      )
    } finally {
      setMovieLookupLoading(false)
    }
  }

  // Calculate start epoch and end time preview
  let startEpochMillis: number | null = null
  let endEpochMillis: number | null = null
  let isPastTime = false

  if (watchedStartDateTime) {
    try {
      const parsedDate = parseISO(watchedStartDateTime)
      startEpochMillis = parsedDate.getTime()
      if (isPastEpochMillis(startEpochMillis)) {
        isPastTime = true
      }

      if (previewMovie?.runtime && startEpochMillis) {
        const { totalMinutes } = parseIsoDuration(previewMovie.runtime)
        endEpochMillis = startEpochMillis + totalMinutes * 60 * 1000
      }
    } catch {
      startEpochMillis = null
      endEpochMillis = null
    }
  }

  const onSubmit = async (values: ShowFormValues) => {
    if (!screenId) return
    setIsSubmitting(true)
    setServerError(null)

    const dateVal = parseISO(values.startDateTime)
    const epochMillis = dateVal.getTime()

    if (isPastEpochMillis(epochMillis)) {
      setServerError('Start time must be in the future.')
      setIsSubmitting(false)
      return
    }

    try {
      const payload: ShowRequest = {
        movieId: values.movieId.trim(),
        startTimeEpochMillis: epochMillis,
      }

      const res = await theatersApi.addShow(values.theaterId.trim(), screenId, payload)
      setShowsCreated((prev) => [res, ...prev])
      toast.success(`Show for "${res.movieTitle}" scheduled successfully!`)
      setValue('startDateTime', '')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isForbidden) {
          setIsForbidden(true)
          setTheaterSource(values.theaterId.trim(), 'opened')
          setServerError("You don't own this theater. Only the theater owner can schedule shows on its screens.")
        } else if (err.isConflict) {
          setServerError(
            'Scheduling conflict (409): This showtime overlaps with an existing scheduled show on this screen.',
          )
        } else if (err.status === 400) {
          setServerError(
            err.message || 'Invalid showtime or this screen does not belong to the selected theater.',
          )
        } else {
          setServerError(err.message)
        }
      } else {
        const msg = setFormServerErrors(err, setError)
        setServerError(msg || 'Failed to schedule show.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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
              ? "You do not have permission to manage this screen."
              : is404
                ? `Screen "${screenId}" was not found.`
                : (screenError instanceof Error ? screenError.message : 'An error occurred.')
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
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
                <CalendarPlus className="size-4" />
                <span>Screening Schedule</span>
              </div>
              <CardTitle className="text-xl font-bold font-heading">Schedule a Show</CardTitle>
              <CardDescription className="text-xs">
                Pick a movie, start time, and verify the computed end time. Overlaps are
                automatically rejected by the backend.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <CardContent className="space-y-4">
                {isForbidden && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2"
                  >
                    <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    <span>You don't own this theater. Only the theater owner can schedule shows on its screens.</span>
                  </div>
                )}

                {serverError && !isForbidden && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2"
                  >
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{serverError}</span>
                  </div>
                )}

                <fieldset disabled={isForbidden} className="space-y-4 disabled:opacity-60">
                  {/* Theater ID */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={theaterIdInputId}>Theater ID</Label>
                      {isTheaterLocked && (
                        <Badge variant="secondary" className="gap-1 text-xs font-normal">
                          <Lock className="size-3" />
                          <span>Locked to theater</span>
                        </Badge>
                      )}
                    </div>
                    {isTheaterLocked ? (
                      <Input
                        id={theaterIdInputId}
                        readOnly
                        className="bg-muted font-mono text-xs cursor-not-allowed"
                        aria-invalid={errors.theaterId !== undefined}
                        {...register('theaterId')}
                      />
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          id={theaterIdInputId}
                          placeholder="UUID of the theater owning this screen"
                          aria-invalid={errors.theaterId !== undefined}
                          {...register('theaterId')}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleLookupTheater(watchedTheaterId)}
                          disabled={theaterLookupLoading || !watchedTheaterId?.trim()}
                          className="shrink-0 h-9"
                        >
                          <Search className="size-3.5 mr-1" />
                          <span>{theaterLookupLoading ? 'Validating…' : 'Validate'}</span>
                        </Button>
                      </div>
                    )}
                    {theaterLookupName && (
                      <p className="text-xs text-primary font-medium">Theater: {theaterLookupName}</p>
                    )}
                    {theaterLookupError && (
                      <p className="text-xs text-destructive">{theaterLookupError}</p>
                    )}
                    {errors.theaterId && (
                      <p className="text-xs text-destructive">{errors.theaterId.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must be the theater where this screen was created.
                    </p>
                  </div>

                  {/* Movie ID Lookup */}
                  <div className="space-y-1.5">
                    <Label htmlFor={movieIdInputId}>Movie Identifier</Label>
                    <div className="flex gap-2">
                      <Input
                        id={movieIdInputId}
                        value={movieLookupId}
                        onChange={(e) => {
                          const val = e.target.value
                          setMovieLookupId(val)
                          setValue('movieId', val, { shouldValidate: true })
                          setPreviewMovie(null)
                          setMovieLookupError(null)
                        }}
                        placeholder="Paste Movie UUID..."
                        aria-invalid={errors.movieId !== undefined}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLookupMovie(movieLookupId)}
                        disabled={movieLookupLoading || !movieLookupId.trim()}
                        className="shrink-0 h-9"
                      >
                        <Search className="size-3.5 mr-1" />
                        <span>{movieLookupLoading ? 'Loading…' : 'Lookup'}</span>
                      </Button>
                    </div>
                    {errors.movieId && (
                      <p className="text-xs text-destructive">{errors.movieId.message}</p>
                    )}
                    {movieLookupError && (
                      <p className="text-xs text-destructive">{movieLookupError}</p>
                    )}
                    {watchedMovieId && !previewMovie && !movieLookupLoading && (
                      <p className="text-xs text-muted-foreground">
                        Click &ldquo;Lookup&rdquo; to verify the movie before scheduling.
                      </p>
                    )}
                  </div>

                  {/* Preview Movie Card if loaded */}
                  {previewMovie && (
                    <div className="rounded-lg border border-border/80 bg-muted/30 p-3 flex items-center gap-3">
                      <PosterPlaceholder
                        title={previewMovie.title}
                        movieId={previewMovie.movieId}
                        genre={previewMovie.genre}
                        certificate={previewMovie.certificate}
                        aspectRatio="poster"
                        className="size-14 rounded-xs shrink-0"
                      />
                      <div className="space-y-0.5 text-xs truncate">
                        <p className="font-semibold text-foreground truncate">{previewMovie.title}</p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {previewMovie.certificate}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatRuntime(previewMovie.runtime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show Date & Time */}
                  <div className="space-y-1.5">
                    <Label htmlFor={dateTimeInputId}>Start Date & Time (Local)</Label>
                    <Input
                      id={dateTimeInputId}
                      type="datetime-local"
                      aria-invalid={errors.startDateTime !== undefined}
                      {...register('startDateTime')}
                    />
                    {errors.startDateTime && (
                      <p className="text-xs text-destructive">{errors.startDateTime.message}</p>
                    )}
                    {isPastTime && (
                      <p className="text-xs text-destructive">
                        Start time must be in the future.
                      </p>
                    )}
                  </div>

                  {/* Computed End Time Preview */}
                  {startEpochMillis && endEpochMillis && (
                    <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Screening Window:</span>
                        <span className="font-semibold text-foreground tabular-nums">
                          {format(new Date(startEpochMillis), 'p')} → {format(new Date(endEpochMillis), 'p')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground text-xs">
                        <span>Date:</span>
                        <span>{format(new Date(startEpochMillis), 'PP')}</span>
                      </div>
                    </div>
                  )}
                </fieldset>
              </CardContent>

              <CardFooter className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    isSubmitting ||
                    !previewMovie ||
                    previewMovie.movieId !== (watchedMovieId || '').trim() ||
                    !watchedTheaterId?.trim() ||
                    !watchedStartDateTime ||
                    isPastTime ||
                    isForbidden
                  }
                  className="gap-2"
                >
                  <CalendarPlus className="size-4" />
                  <span>{isSubmitting ? 'Scheduling…' : 'Schedule Screening'}</span>
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Scheduled Shows in this Session */}
          {showsCreated.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Scheduled Shows in this Session ({showsCreated.length})
              </h4>
              <div className="space-y-2">
                {showsCreated.map((show) => (
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
                          {format(new Date(show.startTimeEpochMillis), 'p')} – {format(new Date(show.endTimeEpochMillis), 'p')}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Seat Map Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading">Auditorium Layout</h3>
              <Badge variant="outline" className="text-xs font-mono">
                {screen.capacity} Seats
              </Badge>
            </div>

            <SeatMap
              screenId={screen.screenId}
              screenType={screen.screenType}
              capacity={screen.capacity}
              noOfRows={screen.noOfRows}
              seatResponses={screen.seatResponses || []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
