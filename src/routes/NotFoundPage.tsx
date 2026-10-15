import { Link } from 'react-router-dom'
import { Clapperboard, Home, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDocumentTitle } from '@/lib/title'

export function NotFoundPage() {
  useDocumentTitle('404 · Page Not Found')

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <Card className="border-border/80 shadow-lg">
        <CardHeader className="space-y-3 pb-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Clapperboard className="size-7" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
              Error 404
            </span>
            <CardTitle className="text-3xl font-bold font-heading">Page Not Found</CardTitle>
          </div>
          <CardDescription className="text-xs max-w-xs mx-auto leading-relaxed">
            The screening you are looking for has either concluded or does not exist at this URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button size="sm" asChild className="w-full sm:w-auto gap-1.5">
              <Link to="/">
                <Home className="size-3.5" />
                <span>Return to Home</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto gap-1.5">
              <Link to="/movies">
                <Search className="size-3.5" />
                <span>Explore Movies</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
