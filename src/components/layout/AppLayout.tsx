import { Link, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Ticket, User as UserIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/auth.store'

export function AppLayout() {
  const navigate = useNavigate()
  const username = useAuthStore((s) => s.username)
  const role = useAuthStore((s) => s.role)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Ticket className="size-5 text-primary" aria-hidden />
            CineBook
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/movies">Movies</Link>
            </Button>

            {role === 'THEATER_OWNER' && (
              <Button variant="ghost" asChild>
                <Link to="/owner">My Theater</Link>
              </Button>
            )}

            {role === 'ADMIN' && (
              <Button variant="ghost" asChild>
                <Link to="/admin">Admin</Link>
              </Button>
            )}

            {username ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Account menu">
                    <UserIcon className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="truncate text-sm font-medium">{username}</div>
                    <div className="text-xs font-normal text-muted-foreground">{role}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                    <LogOut className="size-4" aria-hidden />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        CineBook — Spring Boot + React major project
      </footer>
    </div>
  )
}
