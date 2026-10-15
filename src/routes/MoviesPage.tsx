import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Film,
  Filter,
  Plus,
  Search,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState, IdLookup, MovieCard, PageHeader } from '@/components/features'
import { formatGenre } from '@/lib/labels'
import { useDocumentTitle } from '@/lib/title'
import { useAuthStore } from '@/store/auth.store'
import { useRecentStore } from '@/store/recent.store'
import { CERTIFICATES, GENRES } from '@/types/api'

// BACKEND-GAP: GET /movies catalog and search endpoint

export function MoviesPage() {
  useDocumentTitle('Browse Movies')
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.role)
  const movies = useRecentStore((s) => s.movies)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL')
  const [selectedCert, setSelectedCert] = useState<string>('ALL')

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (movie.title?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ?? false) ||
        movie.movieId.toLowerCase().includes(searchQuery.toLowerCase().trim())

      const matchesGenre =
        selectedGenre === 'ALL' || movie.genre === selectedGenre

      const matchesCert =
        selectedCert === 'ALL' || movie.certificate === selectedCert

      return matchesSearch && matchesGenre && matchesCert
    })
  }, [movies, searchQuery, selectedGenre, selectedCert])

  const handleOpenById = (id: string) => {
    navigate(`/movies/${id}`)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Movie Catalog"
        description="Browse opened and recently created cinema titles, or look up any movie directly by its unique identifier."
        actions={
          role === 'ROLE_ADMIN' ? (
            <Button size="sm" asChild className="gap-1.5 font-medium">
              <Link to="/admin">
                <Plus className="size-4" />
                <span>Create Movie</span>
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Prominent "Open by ID" & Search Section */}
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 max-w-lg">
            <IdLookup
              label="Open Movie by ID"
              placeholder="Paste a Movie UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)..."
              buttonText="Open"
              onLookup={handleOpenById}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative min-w-[160px] flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter saved titles..."
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Genres</SelectItem>
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {formatGenre(g)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCert} onValueChange={setSelectedCert}>
              <SelectTrigger className="h-9 text-xs w-[110px]">
                <SelectValue placeholder="Cert" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Certs</SelectItem>
                {CERTIFICATES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || selectedGenre !== 'ALL' || selectedCert !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedGenre('ALL')
                  setSelectedCert('ALL')
                }}
                className="h-9 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Movies Grid or Honest Empty State */}
      {movies.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No saved movies yet"
          description="Movies you open or create appear here. Paste a Movie ID above to look up any title."
          action={
            role === 'ROLE_ADMIN' ? (
              <Button asChild size="sm">
                <Link to="/admin">Go to Admin Portal to Create One</Link>
              </Button>
            ) : undefined
          }
        />
      ) : filteredMovies.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No matching movies"
          description="No saved movies match your search filters. Try clearing your filters or paste another movie ID."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedGenre('ALL')
                setSelectedCert('ALL')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'}
            </span>
            <span className="text-xs">Saved titles</span>
          </div>

          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.movieId} movie={movie} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
