import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { formatDistanceToNow, parseISO } from 'date-fns'
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Edit,
  MessageSquare,
  Send,
  Star,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { ApiError, feedbackApi, moviesApi, setFormServerErrors } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  CopyIdButton,
  EmptyState,
  FormAlert,
  PageHeader,
  PosterPlaceholder,
  RatingStars,
} from '@/components/features'
import { formatRuntime } from '@/lib/duration'
import { formatGenre } from '@/lib/labels'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/lib/title'
import { useAuthStore } from '@/store/auth.store'
import { useRecentStore } from '@/store/recent.store'

// BACKEND-GAP: GET /movies/{movieId}/feedback lacks pagination metadata and reviewer display name

const feedbackSchema = z.object({
  rating: z.number().min(1, 'Please select a star rating (1–5)').max(5),
  review: z
    .string()
    .trim()
    .min(1, 'Review cannot be blank')
    .max(500, 'Review must not exceed 500 characters'),
})

type FeedbackFormValues = z.infer<typeof feedbackSchema>

export function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const queryClient = useQueryClient()

  const role = useAuthStore((s) => s.role)
  const saveMovie = useRecentStore((s) => s.saveMovie)
  const removeMovie = useRecentStore((s) => s.removeMovie)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  // Fetch Movie Details
  const {
    data: movie,
    isLoading: movieLoading,
    error: movieError,
    refetch: refetchMovie,
  } = useQuery({
    queryKey: queryKeys.movie(movieId || ''),
    queryFn: ({ signal }) => moviesApi.getById(movieId || '', signal),
    enabled: Boolean(movieId),
    retry: 1,
  })

  useDocumentTitle(movie ? movie.title : 'Movie Details')

  // Save to recent store when successfully loaded
  useEffect(() => {
    if (movie) {
      saveMovie({
        movieId: movie.movieId,
        title: movie.title,
        genre: movie.genre,
        certificate: movie.certificate,
        runtime: movie.runtime,
        ratings: movie.ratings,
      })
    }
  }, [movie, saveMovie])

  // Remove from recent store if 404
  useEffect(() => {
    if (movieError instanceof ApiError && movieError.isNotFound && movieId) {
      removeMovie(movieId)
    }
  }, [movieError, movieId, removeMovie])

  // Fetch Feedbacks using useInfiniteQuery
  const {
    data: feedbackData,
    isLoading: feedbacksLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.feedback(movieId || ''),
    queryFn: ({ pageParam = 0, signal }) =>
      feedbackApi.listForMovie(movieId || '', pageParam, 20, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Stop when a page has fewer than 20 items
      if (lastPage.length < 20) return undefined
      return allPages.length
    },
    // Don't fetch reviews for a movie that failed to load (e.g. a 404).
    enabled: Boolean(movieId) && !movieError,
  })

  const allFeedbacks = feedbackData ? feedbackData.pages.flat() : []

  // Feedback form (start with no rating preselected)
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      review: '',
    },
  })

  const ratingValue = useWatch({ control, name: 'rating' })
  const reviewValue = useWatch({ control, name: 'review' }) || ''

  // Mutation for creating feedback
  const feedbackMutation = useMutation({
    mutationFn: (values: FeedbackFormValues) =>
      feedbackApi.create(movieId || '', {
        rating: values.rating,
        review: values.review.trim(),
      }),
    onSuccess: () => {
      toast.success('Your feedback was submitted successfully!')
      reset({ rating: 0, review: '' })
      setIsFormOpen(false)
      setFeedbackError(null)

      // Invalidate the movie (average rating) and the review list. We must
      // refetch the list rather than prepend into page 0: prepending shifts the
      // server's page boundaries, so a later "Load more" would fetch an item
      // that is already rendered and duplicate it.
      queryClient.invalidateQueries({ queryKey: queryKeys.movie(movieId || '') })
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback(movieId || '') })
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.isConflict) {
        setFeedbackError(
          'You have already submitted a review for this movie. Only one review per member is allowed.',
        )
      } else {
        const msg = setFormServerErrors(err, setError)
        setFeedbackError(msg || 'Failed to submit review.')
      }
    },
  })

  const onSubmitFeedback = (values: FeedbackFormValues) => {
    setFeedbackError(null)
    feedbackMutation.mutate(values)
  }

  // Loading skeleton state
  if (movieLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="grid gap-8 md:grid-cols-3">
          <div className="aspect-[2/3] rounded-xl bg-muted" />
          <div className="space-y-4 md:col-span-2">
            <div className="h-10 w-3/4 rounded-md bg-muted" />
            <div className="h-5 w-1/3 rounded-md bg-muted" />
            <div className="h-24 w-full rounded-md bg-muted" />
            <div className="h-12 w-2/3 rounded-md bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  // 404 / Error state
  if (movieError || !movie) {
    const is404 = movieError instanceof ApiError && movieError.isNotFound
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
          title={is404 ? 'Movie not found' : 'Failed to load movie'}
          description={
            is404
              ? `We could not find any movie with ID: "${movieId}". Double-check the identifier or browse other titles.`
              : (movieError instanceof Error ? movieError.message : 'An error occurred while fetching the movie.')
          }
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => refetchMovie()}>
                Try Again
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/movies">Browse Catalog</Link>
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <PageHeader
        title={movie.title}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Movies', href: '/movies' },
          { label: movie.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <CopyIdButton id={movie.movieId} label="Movie ID" variant="outline" size="sm" />
            {role === 'ROLE_ADMIN' && (
              <Button size="sm" variant="secondary" asChild className="gap-1.5 font-medium">
                <Link to="/admin">
                  <Edit className="size-3.5" />
                  <span>Admin Edit</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Hero section */}
      <section className="grid gap-8 md:grid-cols-12 items-start">
        {/* Left: Poster */}
        <div className="md:col-span-4 lg:col-span-3">
          <PosterPlaceholder
            title={movie.title}
            movieId={movie.movieId}
            genre={movie.genre}
            certificate={movie.certificate}
            aspectRatio="poster"
            className="shadow-2xl rounded-xl border border-white/10"
          />
        </div>

        {/* Right: Details */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wider">
                {formatGenre(movie.genre)}
              </Badge>
              <Badge variant="outline" className="text-xs font-bold border-primary/40 text-primary">
                {movie.certificate}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                <Clock className="size-3.5" />
                <span>{formatRuntime(movie.runtime)}</span>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl font-heading text-foreground">
              {movie.title}
            </h1>

            {/* Rating display */}
            <div className="flex items-center gap-3 pt-1">
              <RatingStars value={movie.ratings} size="lg" showText />
              <span className="text-xs text-muted-foreground">
                ({allFeedbacks.length}
                {hasNextPage ? '+' : ''} {allFeedbacks.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
              Overview
            </h3>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed max-w-3xl">
              {movie.description}
            </p>
          </div>

          {/* Cast Chips */}
          {movie.castList && movie.castList.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                <Users className="size-3.5" />
                <span>Featured Cast</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {movie.castList.map((actor) => (
                  <Badge
                    key={actor}
                    variant="outline"
                    className="px-3 py-1 text-xs font-medium bg-card/60 border-border/80"
                  >
                    {actor}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Reviews & Feedback Section */}
      <section className="space-y-6 pt-6 border-t border-border/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              <h2 className="text-2xl font-bold font-heading tracking-tight">Community Reviews</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Feedback from CineBook members.
            </p>
          </div>

          {/* Review action for ROLE_USER */}
          {role === 'ROLE_USER' && (
            <Button
              onClick={() => setIsFormOpen(!isFormOpen)}
              size="sm"
              variant={isFormOpen ? 'outline' : 'default'}
              className="gap-2 text-xs font-semibold"
            >
              <Star className="size-3.5 fill-current" />
              <span>{isFormOpen ? 'Cancel Review' : 'Write a Review'}</span>
            </Button>
          )}
        </div>

        {/* Interactive Feedback Form (ROLE_USER only) */}
        {role === 'ROLE_USER' && isFormOpen && (
          <Card className="border-primary/40 bg-card shadow-md animate-in fade-in-50 duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Write your review</CardTitle>
              <CardDescription className="text-xs">
                Rate the movie from 1 to 5 stars and share your honest thoughts. One review per member.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmitFeedback)} noValidate>
              <CardContent className="space-y-4">
                {feedbackError && <FormAlert>{feedbackError}</FormAlert>}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Your Rating</label>
                  <div>
                    <RatingStars
                      value={ratingValue}
                      onChange={(val) => setValue('rating', val, { shouldValidate: true })}
                      size="lg"
                    />
                  </div>
                  {errors.rating && (
                    <p className="text-xs text-destructive">{errors.rating.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="review-text" className="text-xs font-medium text-muted-foreground">
                      Review text
                    </label>
                    <span
                      className={`text-xs tabular-nums ${reviewValue.length > 500 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}
                    >
                      {reviewValue.length} / 500 characters
                    </span>
                  </div>
                  <Textarea
                    id="review-text"
                    rows={4}
                    placeholder="What did you think of the direction, performance, and story?"
                    aria-invalid={errors.review !== undefined}
                    {...register('review')}
                  />
                  {errors.review && (
                    <p className="text-xs text-destructive">{errors.review.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={feedbackMutation.isPending}
                    className="gap-2"
                  >
                    <Send className="size-3.5" />
                    <span>{feedbackMutation.isPending ? 'Submitting…' : 'Post Review'}</span>
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        )}

        {/* Reviews List */}
        {feedbacksLoading && allFeedbacks.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : allFeedbacks.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No reviews yet"
            description="Be the first to share your thoughts on this movie."
            action={
              role === 'ROLE_USER' && !isFormOpen ? (
                <Button size="sm" onClick={() => setIsFormOpen(true)}>
                  Write First Review
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {allFeedbacks.map((item) => {
                let relativeTime = 'Recently'
                try {
                  relativeTime = formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })
                } catch {
                  relativeTime = 'Recently'
                }

                return (
                  <Card key={item.feedbackId} className="border border-border/70 bg-card/60 p-4 sm:p-5">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <RatingStars value={item.rating} size="sm" />
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {relativeTime}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                        {item.review}
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>

            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Loading more…' : 'Load more reviews'}
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
