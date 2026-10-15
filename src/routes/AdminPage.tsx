import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Edit, Plus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, moviesApi } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/features'
import {
  MovieCreateForm,
  MovieManagePanel,
  SavedMoviesTable,
  type ManageSeed,
} from '@/components/features/admin'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/lib/title'
import { useRecentStore } from '@/store/recent.store'
import type { MovieResponse } from '@/types/api'

export function AdminPage() {
  useDocumentTitle('Admin · Movie Management')
  const queryClient = useQueryClient()
  const movies = useRecentStore((s) => s.movies)
  const saveMovie = useRecentStore((s) => s.saveMovie)

  const [activeTab, setActiveTab] = useState('create')
  const [manageSeed, setManageSeed] = useState<ManageSeed | null>(null)

  const openManage = useCallback((movieId: string, movie?: MovieResponse) => {
    setManageSeed({ movieId, movie, nonce: Date.now() })
    setActiveTab('manage')
  }, [])

  const handleCreated = useCallback(
    (movie: MovieResponse) => {
      openManage(movie.movieId, movie)
    },
    [openManage],
  )

  const handleEditFromTable = useCallback(
    async (movieId: string) => {
      try {
        const res = await moviesApi.getById(movieId)
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
        openManage(res.movieId, res)
      } catch (err) {
        toast.error(
          err instanceof ApiError && err.isNotFound ? 'Movie not found.' : 'Failed to look up movie.',
        )
      }
    },
    [openManage, queryClient, saveMovie],
  )

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
          <MovieCreateForm onCreated={handleCreated} />
        </TabsContent>

        {/* Tab 2: Manage Existing Movie (Separate PUT endpoints) */}
        <TabsContent value="manage" className="space-y-8">
          <MovieManagePanel key={manageSeed?.nonce ?? 'idle'} seed={manageSeed} />
        </TabsContent>
      </Tabs>

      <SavedMoviesTable
        movies={movies}
        onEdit={(movieId) => {
          void handleEditFromTable(movieId)
        }}
      />
    </div>
  )
}
