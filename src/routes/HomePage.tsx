import { Link, useNavigate } from 'react-router-dom'
import {
  Armchair,
  ArrowRight,
  Building,
  CalendarDays,
  Film,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IdLookup } from '@/components/features/IdLookup'
import { useDocumentTitle } from '@/lib/title'
import { useAuthStore } from '@/store/auth.store'

const CORE_CAPABILITIES = [
  {
    icon: Film,
    title: 'Movie Catalog & Details',
    body: 'Look up movies by ID with comprehensive metadata: runtimes, age certificates, genres, and cast details.',
  },
  {
    icon: MessageSquare,
    title: 'Movie Reviews & Ratings',
    body: 'Read community feedback and ratings. Signed-in users can submit reviews with 1–5 star ratings.',
  },
  {
    icon: Building,
    title: 'Theater & Screen Setup',
    body: 'Cinema owners can register venues and configure 2D, 3D, and IMAX halls with auditorium seat layouts.',
  },
  {
    icon: CalendarDays,
    title: 'Showtime Scheduling',
    body: 'Schedule screenings with duration tracking and slot-overlap prevention.',
  },
] as const

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Sign in to your account',
    desc: 'Create an account to explore movies and share ratings.',
  },
  {
    step: '02',
    title: 'Discover or Share by ID',
    desc: 'Access movies, theaters, and screen layouts directly via their unique identifiers.',
  },
  {
    step: '03',
    title: 'Interactive Seat Maps',
    desc: 'Inspect auditorium layouts and interactive seat maps for scheduled screenings.',
  },
]

export function HomePage() {
  useDocumentTitle('Discover & Experience Cinema')
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card to-background p-8 sm:p-14 shadow-lg text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-80" />

        <div className="relative z-10 mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            <span>Cinema Discovery & Management</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-heading text-foreground">
            The modern gateway for{' '}
            <span className="text-primary italic">cinema discovery</span>
          </h1>

          <p className="text-base text-muted-foreground sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Explore movie metadata, read community feedback, inspect auditorium
            seat maps, and empower theater operators with show scheduling.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {token ? (
              <>
                <Button size="lg" className="w-full sm:w-auto font-semibold gap-2 shadow-md" asChild>
                  <Link to="/movies">
                    <Film className="size-4" />
                    <span>Browse Movies</span>
                  </Link>
                </Button>

                {role === 'ROLE_THEATER_OWNER' && (
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2" asChild>
                    <Link to="/owner">
                      <Building className="size-4" />
                      <span>Owner Dashboard</span>
                    </Link>
                  </Button>
                )}

                {role === 'ROLE_ADMIN' && (
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2" asChild>
                    <Link to="/admin">
                      <ShieldCheck className="size-4" />
                      <span>Admin Management</span>
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button size="lg" className="w-full sm:w-auto font-semibold gap-2 shadow-md" asChild>
                  <Link to="/register">
                    <span>Create Free Account</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                  <Link to="/login">Sign in to your account</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Quick Open by ID Widget */}
        <div className="relative z-10 mx-auto mt-10 max-w-md rounded-xl border border-border/80 bg-background/90 p-4 shadow-sm backdrop-blur-xs">
          <IdLookup
            label="Quick Open Movie by ID"
            placeholder="Paste a Movie UUID..."
            buttonText="Open"
            onLookup={(id) => navigate(`/movies/${id}`)}
          />
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="space-y-6">
        <div className="text-center space-y-1.5 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight font-heading sm:text-3xl">
            Everything in one place
          </h2>
          <p className="text-sm text-muted-foreground">
            A clear, intuitive interface for movie lovers and theater managers.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CORE_CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <Card
              key={title}
              className="cinema-card-lift border border-border/70 bg-card hover:border-primary/40"
            >
              <CardHeader className="space-y-2 pb-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="rounded-xl border border-border bg-card/40 p-8 sm:p-10 space-y-8">
        <div className="space-y-1">
          <h3 className="text-xl font-bold font-heading">How CineBook Works</h3>
          <p className="text-xs text-muted-foreground">
            Simple, step-by-step cinema exploration and management.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((item) => (
            <div key={item.step} className="space-y-2 border-l-2 border-primary/60 pl-4">
              <span className="font-mono text-xs font-bold text-primary">{item.step}</span>
              <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Notice on Booking Capabilities */}
      <section className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 font-semibold text-foreground">
            <Armchair className="size-4 text-primary" />
            <span>Looking for online ticket booking?</span>
          </div>
          <p className="text-muted-foreground max-w-xl">
            Ticket reservations and checkout features are coming soon. Explore movies, theaters, and seat layouts today.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0 text-xs">
          <Link to="/movies">Explore Movies</Link>
        </Button>
      </section>
    </div>
  )
}
