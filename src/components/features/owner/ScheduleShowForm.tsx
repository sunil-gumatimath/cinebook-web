import { useEffect, useId, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { CalendarPlus, Clock, Lock, Search, ShieldAlert } from 'lucide-react'
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
import { FormAlert, PosterPlaceholder } from '@/components/features'
import { isPastEpochMillis } from '@/lib/date'
import { formatRuntime, parseIsoDuration } from '@/lib/duration'
import { useRecentStore } from '@/store/recent.store'
import type { MovieResponse, ShowRequest, ShowResponse } from '@/types/api'

const showSchema = z.object({
  theaterId: z.string().trim().min(1, 'Theater ID is required'),
  movieId: z.string().trim().min(1, 'Movie ID is required'),
  startDateTime: z.string().min(1, 'Show date and time are required'),
})

type ShowFormValues = z.infer<typeof showSchema>

interface ScheduleShowFormProps {
  screenId: string
  /** Theater ID from the query string. When present the field is locked. */
  queryTheaterId: string | null
  /** Initial theater ID derived from the query string or recent screens. */
  initialTheaterId: string
  onShowCreated: (show: ShowResponse) => void
}

/** Left-hand "Schedule a Show" card: theater/movie lookup plus start-time picker. */
export function ScheduleShowForm({
  screenId,
  queryTheaterId,
  initialTheaterId,
  onShowCreated,
}: ScheduleShowFormProps) {
  const setTheaterSource = useRecentStore((s) => s.setTheaterSource)

  const isTheaterLocked = Boolean(queryTheaterId)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isForbidden, setIsForbidden] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const [theaterLookupName, setTheaterLookupName] = useState<string | null>(null)
  const [theaterLookupLoading, setTheaterLookupLoading] = useState(false)
  const [theaterLookupError, setTheaterLookupError] = useState<string | null>(null)

  const [movieLookupId, setMovieLookupId] = useState('')
  const [previewMovie, setPreviewMovie] = useState<MovieResponse | null>(null)
  const [movieLookupLoading, setMovieLookupLoading] = useState(false)
  const [movieLookupError, setMovieLookupError] = useState<string | null>(null)

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
      onShowCreated(res)
      toast.success(`Show for "${res.movieTitle}" scheduled successfully!`)
      setValue('startDateTime', '')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isForbidden) {
          setIsForbidden(true)
          setTheaterSource(values.theaterId.trim(), 'opened')
          setServerError(
            "You don't own this theater. Only the theater owner can schedule shows on its screens.",
          )
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

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <CalendarPlus className="size-4" />
          <span>Screening Schedule</span>
        </div>
        <CardTitle className="text-xl font-bold font-heading">Schedule a Show</CardTitle>
        <CardDescription className="text-xs">
          Pick a movie, start time, and verify the computed end time. Overlaps are automatically
          rejected by the backend.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {isForbidden && (
            <FormAlert icon={ShieldAlert}>
              <p>
                You don&apos;t own this theater. Only the theater owner can schedule shows on its
                screens.
              </p>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="mt-2"
                onClick={() => {
                  // Allow the owner to retry (e.g. after management was granted
                  // elsewhere) instead of leaving the form permanently locked.
                  setIsForbidden(false)
                  setServerError(null)
                }}
              >
                Try again
              </Button>
            </FormAlert>
          )}

          {serverError && !isForbidden && <FormAlert>{serverError}</FormAlert>}

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
              {theaterLookupError && <p className="text-xs text-destructive">{theaterLookupError}</p>}
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
              {errors.movieId && <p className="text-xs text-destructive">{errors.movieId.message}</p>}
              {movieLookupError && <p className="text-xs text-destructive">{movieLookupError}</p>}
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
                <p className="text-xs text-destructive">Start time must be in the future.</p>
              )}
            </div>

            {/* Computed End Time Preview */}
            {startEpochMillis && endEpochMillis && (
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Screening Window:</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {format(new Date(startEpochMillis), 'p')} →{' '}
                    {format(new Date(endEpochMillis), 'p')}
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
  )
}
