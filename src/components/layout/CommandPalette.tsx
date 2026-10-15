import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Armchair,
  Building,
  Film,
  Home,
  LogIn,
  Shield,
  User,
  UserPlus,
} from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { formatScreenType } from '@/lib/labels'
import { useAuthStore } from '@/store/auth.store'
import { useRecentStore } from '@/store/recent.store'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PREFIXED_ID_PATTERN = /^(movie|theater|screen|user)-[a-z0-9_-]+$/i

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.role)
  const token = useAuthStore((s) => s.token)
  const { movies, theaters, screens } = useRecentStore()
  const [search, setSearch] = useState('')

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setSearch('')
      }
      onOpenChange(newOpen)
    },
    [onOpenChange],
  )

  // Close the palette if the session ends while it is open.
  useEffect(() => {
    if (!token && open) onOpenChange(false)
  }, [token, open, onOpenChange])

  useEffect(() => {
    if (!token) return
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleOpenChange(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, handleOpenChange, token])

  const runCommand = (command: () => void) => {
    handleOpenChange(false)
    command()
  }

  const trimmedSearch = search.trim()
  const isMatchingId = UUID_PATTERN.test(trimmedSearch) || PREFIXED_ID_PATTERN.test(trimmedSearch)

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="CineBook Quick Navigation"
      description="Jump to pages, recent items, or open any ID"
    >
      <CommandInput
        placeholder="Type a command, movie title, or paste an ID..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No matching items found.</CommandEmpty>

        {/* Quick ID Open only if query matches a valid UUID or ID pattern */}
        {isMatchingId && (
          <CommandGroup heading="Open by ID">
            <CommandItem
              onSelect={() => runCommand(() => navigate(`/movies/${trimmedSearch}`))}
            >
              <Film className="mr-2 size-4 text-primary" />
              <span>Open Movie ID: <strong className="font-mono">{trimmedSearch}</strong></span>
            </CommandItem>

            <CommandItem
              onSelect={() => runCommand(() => navigate(`/theaters/${trimmedSearch}`))}
            >
              <Building className="mr-2 size-4 text-primary" />
              <span>Open Theater ID: <strong className="font-mono">{trimmedSearch}</strong></span>
            </CommandItem>

            <CommandItem
              onSelect={() => runCommand(() => navigate(`/screens/${trimmedSearch}`))}
            >
              <Armchair className="mr-2 size-4 text-primary" />
              <span>Open Screen ID: <strong className="font-mono">{trimmedSearch}</strong></span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <Home className="mr-2 size-4" />
            <span>Home</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => navigate('/movies'))}>
            <Film className="mr-2 size-4" />
            <span>Browse Movies</span>
          </CommandItem>

          {role === 'ROLE_THEATER_OWNER' && (
            <CommandItem onSelect={() => runCommand(() => navigate('/owner'))}>
              <Building className="mr-2 size-4" />
              <span>Owner Dashboard</span>
            </CommandItem>
          )}

          {role === 'ROLE_ADMIN' && (
            <CommandItem onSelect={() => runCommand(() => navigate('/admin'))}>
              <Shield className="mr-2 size-4" />
              <span>Admin Management</span>
            </CommandItem>
          )}

          {token ? (
            <CommandItem onSelect={() => runCommand(() => navigate('/profile'))}>
              <User className="mr-2 size-4" />
              <span>My Profile</span>
            </CommandItem>
          ) : (
            <>
              <CommandItem onSelect={() => runCommand(() => navigate('/login'))}>
                <LogIn className="mr-2 size-4" />
                <span>Sign In</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/register'))}>
                <UserPlus className="mr-2 size-4" />
                <span>Create Account</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>

        {/* Recent Movies */}
        {movies.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Movies">
              {movies.slice(0, 5).map((m) => (
                <CommandItem
                  key={m.movieId}
                  onSelect={() => runCommand(() => navigate(`/movies/${m.movieId}`))}
                >
                  <Film className="mr-2 size-4 text-muted-foreground" />
                  <span className="truncate">{m.title || `Movie ${m.movieId}`}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground truncate max-w-[100px]">
                    {m.movieId}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Recent Theaters */}
        {theaters.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Theaters">
              {theaters.slice(0, 5).map((t) => (
                <CommandItem
                  key={t.theaterId}
                  onSelect={() => runCommand(() => navigate(`/theaters/${t.theaterId}`))}
                >
                  <Building className="mr-2 size-4 text-muted-foreground" />
                  <span className="truncate">{t.name || `Theater ${t.theaterId}`}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground truncate max-w-[100px]">
                    {t.theaterId}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Recent Screens */}
        {screens.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Screens">
              {screens.slice(0, 5).map((s) => (
                <CommandItem
                  key={s.screenId}
                  onSelect={() => runCommand(() => navigate(`/screens/${s.screenId}`))}
                >
                  <Armchair className="mr-2 size-4 text-muted-foreground" />
                  <span>Screen {formatScreenType(s.screenType) || ''}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground truncate max-w-[100px]">
                    {s.screenId}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
