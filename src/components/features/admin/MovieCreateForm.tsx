import { useId, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Film, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { setFormServerErrors, moviesApi } from '@/api'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FormAlert, MovieCard, RuntimeInput, TagInput } from '@/components/features'
import { formatRuntime, parseIsoDuration } from '@/lib/duration'
import { formatGenre } from '@/lib/labels'
import { queryKeys } from '@/lib/query-keys'
import { useRecentStore } from '@/store/recent.store'
import type { Certificate, Genre, MovieRequest, MovieResponse } from '@/types/api'
import { CERTIFICATES, GENRES } from '@/types/api'

const movieSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be blank'),
  description: z.string().trim().min(1, 'Description cannot be blank'),
  runtime: z
    .string()
    .min(1, 'Runtime is required')
    .refine((val) => {
      const { totalMinutes } = parseIsoDuration(val)
      return totalMinutes > 0 && totalMinutes <= 24 * 60
    }, 'Runtime must be positive and no longer than 24 hours'),
  certificate: z.enum(CERTIFICATES, { message: 'Select a valid certificate' }),
  genre: z.enum(GENRES, { message: 'Select a valid genre' }),
  castList: z.array(z.string()).min(1, 'Cast list must have at least one member'),
})

type MovieFormValues = z.infer<typeof movieSchema>

const EMPTY_FORM: MovieFormValues = {
  title: '',
  description: '',
  runtime: 'PT2H',
  certificate: 'UA',
  genre: 'ACTION',
  castList: [],
}

interface MovieCreateFormProps {
  /** Called with the freshly created movie so the parent can open the manage tab. */
  onCreated: (movie: MovieResponse) => void
}

/** "Create Movie" tab: RHF form plus a live-preview card. */
export function MovieCreateForm({ onCreated }: MovieCreateFormProps) {
  const queryClient = useQueryClient()
  const saveMovie = useRecentStore((s) => s.saveMovie)

  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const titleInputId = useId()
  const descInputId = useId()
  const castId = useId()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: EMPTY_FORM,
  })

  const watchedTitle = useWatch({ control, name: 'title' })
  const watchedGenre = useWatch({ control, name: 'genre' })
  const watchedCertificate = useWatch({ control, name: 'certificate' })
  const watchedRuntime = useWatch({ control, name: 'runtime' })
  const watchedCastList = useWatch({ control, name: 'castList' })
  const watchedDescription = useWatch({ control, name: 'description' })

  const onSubmit = async (values: MovieFormValues) => {
    setIsCreating(true)
    setCreateError(null)

    try {
      const payload: MovieRequest = {
        title: values.title.trim(),
        description: values.description.trim(),
        runtime: values.runtime,
        certificate: values.certificate,
        genre: values.genre,
        castList: values.castList.map((c) => c.trim()).filter(Boolean),
      }

      const res = await moviesApi.create(payload)
      saveMovie({
        movieId: res.movieId,
        title: res.title,
        genre: res.genre,
        certificate: res.certificate,
        runtime: res.runtime,
        ratings: res.ratings,
      })
      // Prime the detail-page cache so it renders immediately without a refetch.
      queryClient.setQueryData(queryKeys.movie(res.movieId), res)

      toast.success(`Movie "${res.title}" created successfully!`)
      reset(EMPTY_FORM)
      onCreated(res)
    } catch (err) {
      const msg = setFormServerErrors(err, setError)
      setCreateError(msg || 'Failed to create movie.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 items-start">
      {/* Form */}
      <div className="lg:col-span-7">
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
              <Film className="size-4" />
              <span>New Catalog Entry</span>
            </div>
            <CardTitle className="text-xl font-bold font-heading">Add New Movie</CardTitle>
            <CardDescription className="text-xs">
              Create a movie entry with ISO runtime duration, age certificate, and cast list.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-4">
              {createError && <FormAlert>{createError}</FormAlert>}

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor={titleInputId}>Movie Title</Label>
                <Input
                  id={titleInputId}
                  placeholder="e.g. Interstellar"
                  aria-invalid={errors.title !== undefined}
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              {/* Genre & Certificate */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Genre</Label>
                  <Select
                    value={watchedGenre}
                    onValueChange={(val) => setValue('genre', val as Genre, { shouldValidate: true })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {formatGenre(g)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.genre && <p className="text-xs text-destructive">{errors.genre.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Age Certificate</Label>
                  <Select
                    value={watchedCertificate}
                    onValueChange={(val) =>
                      setValue('certificate', val as Certificate, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select certificate" />
                    </SelectTrigger>
                    <SelectContent>
                      {CERTIFICATES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.certificate && (
                    <p className="text-xs text-destructive">{errors.certificate.message}</p>
                  )}
                </div>
              </div>

              {/* Runtime Picker */}
              <div className="space-y-1.5">
                <Label>Runtime Duration</Label>
                <RuntimeInput
                  value={watchedRuntime}
                  onChange={(iso) => setValue('runtime', iso, { shouldValidate: true })}
                  error={errors.runtime?.message}
                />
                <p className="text-xs text-muted-foreground font-mono">
                  Formatted: {watchedRuntime} ({formatRuntime(watchedRuntime)})
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor={descInputId}>Synopsis / Description</Label>
                <Textarea
                  id={descInputId}
                  rows={3}
                  placeholder="Detailed overview of the plot and themes..."
                  aria-invalid={errors.description !== undefined}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* Cast Tag Input */}
              <div className="space-y-1.5">
                <Label htmlFor={castId}>Cast Members</Label>
                <TagInput
                  id={castId}
                  value={watchedCastList || []}
                  onChange={(tags) => setValue('castList', tags, { shouldValidate: true })}
                  placeholder="Type actor name and press Enter..."
                  error={errors.castList?.message}
                />
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex justify-end">
              <Button type="submit" size="sm" disabled={isCreating} className="gap-2">
                <Plus className="size-4" />
                <span>{isCreating ? 'Creating…' : 'Publish Movie'}</span>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Right: Live Preview Card */}
      <div className="lg:col-span-5 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Live Card Preview
        </h3>
        <div className="max-w-xs mx-auto">
          <MovieCard
            interactive={false}
            movie={{
              movieId: 'preview-uuid',
              title: watchedTitle || 'Untitled Movie',
              genre: watchedGenre,
              certificate: watchedCertificate,
              runtime: watchedRuntime,
              ratings: 0,
              description: watchedDescription,
            }}
          />
        </div>
      </div>
    </div>
  )
}
