import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Save, Search } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, moviesApi } from '@/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CopyIdButton, TagInput } from '@/components/features'
import { queryKeys } from '@/lib/query-keys'
import { useRecentStore } from '@/store/recent.store'
import { type MovieResponse } from '@/types/api'

/**
 * Tells the manage panel which movie to open. A new `nonce` remounts the panel
 * (via `key`) so its state is initialised straight from `movie` — no sync effect.
 */
export interface ManageSeed {
  movieId: string
  /** The already-known movie (e.g. just created or looked up by the parent). */
  movie?: MovieResponse
  nonce: number
}

interface MovieManagePanelProps {
  seed: ManageSeed | null
}

/** "Manage Movie" tab: lookup by ID plus the three separate PUT editors. */
export function MovieManagePanel({ seed }: MovieManagePanelProps) {
  const queryClient = useQueryClient()
  const saveMovie = useRecentStore((s) => s.saveMovie)

  const initialMovie = seed?.movie ?? null

  const [manageLookupId, setManageLookupId] = useState('')
  const [manageMovie, setManageMovie] = useState<MovieResponse | null>(initialMovie)
  const [manageLoading, setManageLoading] = useState(false)
  const [manageError, setManageError] = useState<string | null>(null)

  const [editTitle, setEditTitle] = useState(initialMovie?.title ?? '')
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false)

  const [editDescription, setEditDescription] = useState(initialMovie?.description ?? '')
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false)

  const [editCast, setEditCast] = useState<string[]>(initialMovie?.castList ?? [])
  const [isUpdatingCast, setIsUpdatingCast] = useState(false)

  const loadMovie = async (id: string) => {
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
      queryClient.setQueryData(queryKeys.movie(res.movieId), res)
      toast.success(`Loaded "${res.title}"`)
    } catch (err) {
      setManageMovie(null)
      setManageError(
        err instanceof ApiError && err.isNotFound ? 'Movie not found.' : 'Failed to look up movie.',
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
      queryClient.invalidateQueries({ queryKey: queryKeys.movie(manageMovie.movieId) })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.movie(manageMovie.movieId) })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.movie(manageMovie.movieId) })
      toast.success('Cast updated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update cast')
    } finally {
      setIsUpdatingCast(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Lookup Input */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-4 sm:p-6">
          <div className="max-w-lg">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void loadMovie(manageLookupId)
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
              {manageError && <p className="text-xs text-destructive">{manageError}</p>}
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Three Separate PUT Cards */}
      {manageMovie && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-heading text-lg font-bold">Editing: {manageMovie.title}</h3>
              <p className="text-xs text-muted-foreground font-mono">ID: {manageMovie.movieId}</p>
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
              <CardTitle className="text-sm font-semibold">1. Update Movie Title</CardTitle>
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
              <CardTitle className="text-sm font-semibold">2. Update Description</CardTitle>
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
              <CardTitle className="text-sm font-semibold">3. Update Cast List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TagInput value={editCast} onChange={setEditCast} placeholder="Add actor name..." />
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
    </div>
  )
}
