import { Link } from 'react-router-dom'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Edit, Eye, Film, Star } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CopyIdButton, EmptyState } from '@/components/features'
import { formatRuntime } from '@/lib/duration'
import { formatGenre } from '@/lib/labels'
import { type RecentMovie } from '@/store/recent.store'

interface SavedMoviesTableProps {
  movies: RecentMovie[]
  onEdit: (movieId: string) => void
}

/** Paginated table of movies tracked in local storage. */
export function SavedMoviesTable({ movies, onEdit }: SavedMoviesTableProps) {
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
            onClick={() => onEdit(row.original.movieId)}
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
    initialState: {
      pagination: { pageSize: 6 },
    },
  })

  return (
    <section className="space-y-4 pt-6 border-t border-border/70">
      <div className="space-y-1">
        <h3 className="text-xl font-bold font-heading">Locally Tracked Movies</h3>
        <p className="text-xs text-muted-foreground">Titles you created or opened on this device.</p>
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
  )
}
