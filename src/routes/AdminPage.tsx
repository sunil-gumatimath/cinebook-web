import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Edit,
  Eye,
  Film,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, moviesApi, setFormServerErrors } from '@/api'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  CopyIdButton,
  EmptyState,
  MovieCard,
  PageHeader,
  RuntimeInput,
  TagInput,
} from '@/components/features'
import { formatRuntime, parseIsoDuration } from '@/lib/duration'
import { formatGenre } from '@/lib/labels'
import { useDocumentTitle } from '@/lib/title'
import { type RecentMovie, useRecentStore } from '@/store/recent.store'
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

export function AdminPage() {
  useDocumentTitle('Admin · Movie Management')
  const { movies, saveMovie } = useRecentStore()

  const [activeTab, setActiveTab] = useState('create')

  // Create form state
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Manage existing movie state
  const [manageLookupId, setManageLookupId] = useState('')
  const [manageMovie, setManageMovie] = useState<MovieResponse | null>(null)
  const [manageLoading, setManageLoading] = useState(false)
  const [manageError, setManageError] = useState<string | null>(null)

  // Separate PUT mutation states
  const [editTitle, setEditTitle] = useState('')
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false)

  const [editDescription, setEditDescription] = useState('')
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false)

  const [editCast, setEditCast] = useState<string[]>([])
  const [isUpdatingCast, setIsUpdatingCast] = useState(false)

  const titleInputId = useId()
  const descInputId = useId()

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
    defaultValues: {
      title: '',
      description: '',
      runtime: 'PT2H',
      certificate: 'UA',
      genre: 'ACTION',
      castList: [],
    },
  })

  const watchedTitle = useWatch({ control, name: 'title' })
  const watchedGenre = useWatch({ control, name: 'genre' })
  const watchedCertificate = useWatch({ control, name: 'certificate' })
  const watchedRuntime = useWatch({ control, name: 'runtime' })
  const watchedCastList = useWatch({ control, name: 'castList' })
  const watchedDescription = useWatch({ control, name: 'description' })

  // Create movie handler
  const onCreateMovie = async (values: MovieFormValues) => {
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

      toast.success(`Movie "${res.title}" created successfully!`)
      reset({
        title: '',
        description: '',
        runtime: 'PT2H',
        certificate: 'UA',
        genre: 'ACTION',
        castList: [],
      })

      // Switch to manage tab with new movie
      setManageMovie(res)
      setEditTitle(res.title)
      setEditDescription(res.description)
      setEditCast(res.castList || [])
      setActiveTab('manage')
    } catch (err) {
      const msg = setFormServerErrors(err, setError)
      setCreateError(msg || 'Failed to create movie.')
    } finally {
      setIsCreating(false)
    }
  }

  // Lookup existing movie for edit
  const handleLookupForManage = async (id: string) => {
    const trimmed = id.trim()
    if (!trimmed) return

    setManageLoading(true)
    setManageError(null)

    try {
      const res = await moviesApi.getById(trimmed)
      setManageMovie(res)
      setEditTitle(res.title)
      setEditDescription(res.description)
      setEditCast(res.castList || [])
      saveMovie({
        movieId: res.movieId,
        title: res.title,
        genre: res.genre,
        certificate: res.certificate,
        runtime: res.runtime,
        ratings: res.ratings,
      })
      toast.success(`Loaded "${res.title}"`)
    } catch (err) {
      setManageMovie(null)
      setManageError(
        err instanceof ApiError && err.isNotFound
          ? 'Movie not found.'
          : 'Failed to look up movie.',
      )
    } finally {
      setManageLoading(false)
    }
  }

  // 1. Update Title PUT
  const handleSaveTitle = async () => {
    if (!manageMovie || !editTitle.trim()) return
    setIsUpdatingTitle(true)
    try {
      const res = await moviesApi.updateTitle(manageMovie.movieId, editTitle.trim())
      setManageMovie(res)
      saveMovie({ ...manageMovie, title: res.title })
      toast.success('Title updated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update title')
    } finally {
      setIsUpdatingTitle(false)
    }
  }

  // 2. Update Description PUT
  const handleSaveDescription = async () => {
    if (!manageMovie || !editDescription.trim()) return
    setIsUpdatingDescription(true)
    try {
      const res = await moviesApi.updateDescription(manageMovie.movieId, editDescription.trim())
      setManageMovie(res)
      saveMovie({ ...manageMovie, description: res.description })
      toast.success('Description updated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update description')
    } finally {
      setIsUpdatingDescription(false)
    }
  }

  // 3. Update Cast PUT
  const handleSaveCast = async () => {
    if (!manageMovie || editCast.length === 0) {
      toast.error('Cast list cannot be empty')
      return
    }
    setIsUpdatingCast(true)
    try {
      const res = await moviesApi.updateCast(manageMovie.movieId, editCast)
      setManageMovie(res)
      saveMovie({ ...manageMovie, castList: res.castList })
      toast.success('Cast updated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update cast')
    } finally {
      setIsUpdatingCast(false)
    }
  }

  // TanStack React Table setup
  const columns: ColumnDef<RecentMovie>[] = [
    {
      accessorKey: 'title',
      header: 'Movie Title',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <Link
            to={`/movies/${row.original.movieId}`}
            className="font-semibold text-sm hover:text-primary transition-colors"
          >
            {row.original.title || 'Untitled'}
          </Link>
          <div className="flex items-center gap-2">
            <CopyIdButton id={row.original.movieId} label="Movie ID" size="xs" variant="ghost" />
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'genre',
      header: 'Genre',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs uppercase">
          {row.original.genre ? formatGenre(row.original.genre) : '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'certificate',
      header: 'Cert',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs font-bold">
          {row.original.certificate || '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'runtime',
      header: 'Runtime',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.original.runtime ? formatRuntime(row.original.runtime) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'ratings',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          <span className="tabular-nums font-semibold">
            {row.original.ratings ? row.original.ratings.toFixed(1) : '0.0'}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              handleLookupForManage(row.original.movieId)
              setActiveTab('manage')
            }}
            className="text-xs gap-1"
          >
            <Edit className="size-3" />
            <span>Edit</span>
          </Button>
          <Button size="xs" variant="ghost" asChild>
            <Link to={`/movies/${row.original.movieId}`}>
              <Eye className="size-3" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: movies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize: 6 },
    },
  })

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Movie Console"
        description="Provision new movie catalog entries, manage existing metadata, and track saved records."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin Portal' }]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 py-1">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>ROLE_ADMIN</span>
            </Badge>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="create" className="text-xs gap-1.5">
            <Plus className="size-3.5" />
            <span>Create Movie</span>
          </TabsTrigger>
          <TabsTrigger value="manage" className="text-xs gap-1.5">
            <Edit className="size-3.5" />
            <span>Manage Movie</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Create Movie with Live Card Preview */}
        <TabsContent value="create" className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Form */}
            <div className="lg:col-span-7">
              <Card className="border border-border/80 shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
                    <Film className="size-4" />
                    <span>New Catalog Entry</span>
                  </div>
                  <CardTitle className="text-xl font-bold font-heading">
                    Add New Movie
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Create a movie entry with ISO runtime duration, age certificate, and cast list.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onCreateMovie)} noValidate>
                  <CardContent className="space-y-4">
                    {createError && (
                      <div
                        role="alert"
                        className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                      >
                        {createError}
                      </div>
                    )}

                    {/* Title */}
                    <div className="space-y-1.5">
                      <Label htmlFor={titleInputId}>Movie Title</Label>
                      <Input
                        id={titleInputId}
                        placeholder="e.g. Interstellar"
                        aria-invalid={errors.title !== undefined}
                        {...register('title')}
                      />
                      {errors.title && (
                        <p className="text-xs text-destructive">{errors.title.message}</p>
                      )}
                    </div>

                    {/* Genre & Certificate */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Genre</Label>
                        <Select
                          value={watchedGenre}
                          onValueChange={(val) =>
                            setValue('genre', val as Genre, { shouldValidate: true })
                          }
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
                        {errors.genre && (
                          <p className="text-xs text-destructive">{errors.genre.message}</p>
                        )}
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
                      <Label>Cast Members</Label>
                      <TagInput
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
        </TabsContent>

        {/* Tab 2: Manage Existing Movie (Separate PUT endpoints) */}
        <TabsContent value="manage" className="space-y-8">
          {/* Lookup Input */}
          <Card className="border border-border/80 shadow-xs">
            <CardContent className="p-4 sm:p-6">
              <div className="max-w-lg">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleLookupForManage(manageLookupId)
                  }}
                  className="space-y-1.5"
                >
                  <label className="text-xs font-medium text-muted-foreground">
                    Look up Movie by ID to Edit
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={manageLookupId}
                      onChange={(e) => setManageLookupId(e.target.value)}
                      placeholder="Paste Movie UUID..."
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={manageLoading || !manageLookupId.trim()}
                      className="shrink-0 h-9"
                    >
                      <Search className="size-3.5 mr-1" />
                      <span>{manageLoading ? 'Loading…' : 'Load Movie'}</span>
                    </Button>
                  </div>
                  {manageError && (
                    <p className="text-xs text-destructive">{manageError}</p>
                  )}
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Three Separate PUT Cards */}
          {manageMovie && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-heading text-lg font-bold">
                    Editing: {manageMovie.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {manageMovie.movieId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CopyIdButton id={manageMovie.movieId} label="Movie ID" size="xs" variant="ghost" />
                  <Button size="xs" variant="outline" asChild>
                    <Link to={`/movies/${manageMovie.movieId}`}>View Details</Link>
                  </Button>
                </div>
              </div>

              {/* 1. PUT Title */}
              <Card className="border border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    1. Update Movie Title
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Updated movie title"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="xs"
                      onClick={handleSaveTitle}
                      disabled={isUpdatingTitle || !editTitle.trim() || editTitle === manageMovie.title}
                      className="gap-1.5"
                    >
                      <Save className="size-3" />
                      <span>{isUpdatingTitle ? 'Saving…' : 'Save Title'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 2. PUT Description */}
              <Card className="border border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    2. Update Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Updated movie description"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="xs"
                      onClick={handleSaveDescription}
                      disabled={
                        isUpdatingDescription ||
                        !editDescription.trim() ||
                        editDescription === manageMovie.description
                      }
                      className="gap-1.5"
                    >
                      <Save className="size-3" />
                      <span>{isUpdatingDescription ? 'Saving…' : 'Save Description'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 3. PUT Cast */}
              <Card className="border border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    3. Update Cast List
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <TagInput
                    value={editCast}
                    onChange={setEditCast}
                    placeholder="Add actor name..."
                  />
                  <div className="flex justify-end">
                    <Button
                      size="xs"
                      onClick={handleSaveCast}
                      disabled={isUpdatingCast || editCast.length === 0}
                      className="gap-1.5"
                    >
                      <Save className="size-3" />
                      <span>{isUpdatingCast ? 'Saving…' : 'Save Cast'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Saved Movies TanStack Table */}
      <section className="space-y-4 pt-6 border-t border-border/70">
        <div className="space-y-1">
          <h3 className="text-xl font-bold font-heading">Locally Tracked Movies</h3>
          <p className="text-xs text-muted-foreground">
            Titles you created or opened on this device.
          </p>
        </div>

        {movies.length === 0 ? (
          <EmptyState
            icon={Film}
            title="No movies saved locally"
            description="Create a movie above or look up an existing ID to populate this table."
          />
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/80 overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-xs font-semibold">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {table.getPageCount() > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
