import { Suspense, useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  AlertTriangle,
  Building,
  Clapperboard,
  Film,
  Home,
  LogOut,
  Menu,
  Search,
  Shield,
  Ticket,
  User as UserIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuthStore } from '@/store/auth.store'
import { useNetworkStore } from '@/store/network.store'
import { formatRole } from '@/types/api'
import { cn } from '@/lib/utils'

import { CommandPalette } from './CommandPalette'
import { PageSkeleton } from './PageSkeleton'
import { ThemeToggle } from './ThemeToggle'

const CURRENT_YEAR = new Date().getFullYear()

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const username = useAuthStore((s) => s.username)
  const role = useAuthStore((s) => s.role)
  const email = useAuthStore((s) => s.email)
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)

  const isServerDown = useNetworkStore((s) => s.isServerDown)
  const setServerDown = useNetworkStore((s) => s.setServerDown)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

  const navLinks = [
    { to: '/', label: 'Home', icon: Home, show: true },
    { to: '/movies', label: 'Movies', icon: Film, show: Boolean(token) },
    {
      to: '/owner',
      label: 'My Theater',
      icon: Building,
      show: role === 'ROLE_THEATER_OWNER',
    },
    {
      to: '/admin',
      label: 'Admin',
      icon: Shield,
      show: role === 'ROLE_ADMIN',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Global Network Down Banner */}
      {isServerDown && (
        <div
          role="alert"
          className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-destructive px-4 py-2.5 text-xs font-medium text-destructive-foreground shadow-md sm:px-6"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            <span>Can't reach the server. Check your connection and try again.</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => {
              setServerDown(false)
              window.location.reload()
            }}
            className="border-white/30 bg-black/20 text-white hover:bg-black/40 hover:text-white"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors">
        <nav
          className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Main Navigation"
        >
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Ticket className="size-5" aria-hidden="true" />
              </div>
              <span className="font-heading text-xl tracking-tight">CineBook</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {navLinks
                .filter((link) => link.show)
                .map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground',
                        isActive
                          ? 'text-foreground font-semibold bg-muted/80'
                          : 'text-muted-foreground hover:bg-muted/40',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
            </div>
          </div>

          {/* Right Header Affordances */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Command Palette Trigger */}
            {token && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="hidden h-9 w-40 justify-between rounded-lg border-border/60 bg-muted/40 px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground sm:flex lg:w-56"
                >
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <Search className="size-3.5" />
                    <span>Search or jump to…</span>
                  </span>
                  <kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded-sm border border-border/80 bg-background px-1.5 font-mono text-xs font-medium text-muted-foreground">
                    <span>{isMac ? '⌘' : 'Ctrl+'}</span>K
                  </kbd>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="size-9 sm:hidden"
                  aria-label="Open command search"
                >
                  <Search className="size-4" />
                </Button>
              </>
            )}

            <ThemeToggle />

            {/* Account / Auth Navigation */}
            {token ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 h-9 border-border/80 bg-card hover:bg-muted focus-visible:ring-primary"
                    aria-label="User account menu"
                  >
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {(username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline-block max-w-[120px] truncate text-xs font-medium">
                      {username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 p-1.5 shadow-xl">
                  <DropdownMenuLabel className="space-y-1 p-2">
                    <p className="text-sm font-semibold truncate text-foreground">{username}</p>
                    <p className="text-xs text-muted-foreground truncate font-mono">{email}</p>
                    <div className="pt-1">
                      <Badge variant="secondary" className="text-xs font-medium">
                        {formatRole(role)}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <UserIcon className="size-4 text-muted-foreground" />
                      <span>Account Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  {role === 'ROLE_THEATER_OWNER' && (
                    <DropdownMenuItem asChild>
                      <Link to="/owner" className="flex items-center gap-2 cursor-pointer">
                        <Building className="size-4 text-muted-foreground" />
                        <span>Theater Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {role === 'ROLE_ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="size-4 text-muted-foreground" />
                        <span>Admin Console</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex text-xs">
                  <Link to="/login" state={{ from: location.pathname }}>
                    Sign in
                  </Link>
                </Button>
                <Button size="sm" asChild className="hidden sm:inline-flex h-9 px-3.5 text-xs font-medium">
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}

            {/* Mobile Nav Hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 md:hidden"
                  aria-label="Open mobile navigation menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-xs p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <SheetHeader className="p-0 text-left">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Ticket className="size-4" />
                      </div>
                      <SheetTitle className="text-lg font-bold">CineBook</SheetTitle>
                    </div>
                  </SheetHeader>

                  {token && (
                    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                      <p className="text-xs font-semibold truncate text-foreground">{username}</p>
                      <p className="text-xs text-muted-foreground truncate">{email}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {formatRole(role)}
                      </Badge>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    {navLinks
                      .filter((link) => link.show)
                      .map((link) => (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          end={link.to === '/'}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )
                          }
                        >
                          <link.icon className="size-4" />
                          <span>{link.label}</span>
                        </NavLink>
                      ))}

                    {token && (
                      <NavLink
                        to="/profile"
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )
                        }
                      >
                        <UserIcon className="size-4" />
                        <span>Profile & Settings</span>
                      </NavLink>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-border">
                  {token ? (
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2 text-sm"
                      onClick={() => {
                        setMobileOpen(false)
                        handleLogout()
                      }}
                    >
                      <LogOut className="size-4" />
                      <span>Sign out</span>
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        asChild
                        className="w-full text-sm"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link to="/login" state={{ from: location.pathname }}>
                          Sign in
                        </Link>
                      </Button>
                      <Button
                        asChild
                        className="w-full text-sm"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link to="/register">Register</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Command Palette Modal */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* Footer without dev-facing copy */}
      <footer className="border-t border-border/70 bg-card/40 py-10 text-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2 max-w-sm">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Clapperboard className="size-4" />
                </div>
                <span className="font-heading font-bold text-base tracking-tight">CineBook</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Premium cinema discovery, movie reviews, and theater management. Designed for moviegoers and cinema operators.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 text-xs">
              <div className="space-y-2.5">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-xs">
                  Explore
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <Link to="/movies" className="hover:text-foreground transition-colors">
                      Browse Movies
                    </Link>
                  </li>
                  <li>
                    <Link to="/#features" className="hover:text-foreground transition-colors">
                      Features
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-xs">
                  Account
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <Link to="/login" className="hover:text-foreground transition-colors">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-foreground transition-colors">
                      Register
                    </Link>
                  </li>
                  {token && (
                    <li>
                      <Link to="/profile" className="hover:text-foreground transition-colors">
                        Settings
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              <div className="space-y-2.5 col-span-2 sm:col-span-1">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-xs">
                  Quick Actions
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  {token && (
                    <li>
                      <button
                        type="button"
                        onClick={() => setCommandPaletteOpen(true)}
                        className="hover:text-foreground transition-colors text-left"
                      >
                        Search ({isMac ? '⌘K' : 'Ctrl+K'})
                      </button>
                    </li>
                  )}
                  {role === 'ROLE_THEATER_OWNER' && (
                    <li>
                      <Link to="/owner" className="hover:text-foreground transition-colors">
                        Theater Dashboard
                      </Link>
                    </li>
                  )}
                  {role === 'ROLE_ADMIN' && (
                    <li>
                      <Link to="/admin" className="hover:text-foreground transition-colors">
                        Admin Portal
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {CURRENT_YEAR} CineBook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
