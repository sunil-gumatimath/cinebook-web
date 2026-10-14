import { CalendarDays, Film, MapPin, Sofa } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  { icon: Film, title: 'Browse movies', body: 'Titles, runtimes, certificates and cast.' },
  { icon: CalendarDays, title: 'Pick a showtime', body: 'See what is playing across screens.' },
  { icon: Sofa, title: 'Choose your seats', body: 'Live seat map with categories and availability.' },
  { icon: MapPin, title: 'Find theaters', body: 'Locations, screens and show schedules.' },
] as const

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Book your next movie</h1>
        <p className="max-w-2xl text-muted-foreground">
          A full-stack movie ticket booking system — Spring Boot 3 + JWT on the backend,
          React 19 + TypeScript on the front.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="size-5 text-primary" aria-hidden />
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>What is wired up so far</CardTitle>
          <CardDescription>Typed API layer, JWT auth store, and role-based routing.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The API client mirrors all 17 backend endpoints with TypeScript types. Feature screens
          are stubbed — next up is the movie catalog and the seat-selection grid.
        </CardContent>
      </Card>
    </div>
  )
}
