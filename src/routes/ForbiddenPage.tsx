import { Link } from 'react-router-dom'
import { ArrowLeft, Home, ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDocumentTitle } from '@/lib/title'

export function ForbiddenPage() {
  useDocumentTitle('Access Denied')

  return (
    <div className="mx-auto max-w-md py-12">
      <Card className="border-border/80 shadow-lg text-center">
        <CardHeader className="space-y-3 pb-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold font-heading">Access Denied</CardTitle>
          <CardDescription className="text-xs max-w-xs mx-auto leading-relaxed">
            Your account does not possess the required authorization permissions to access this
            resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Role Requirements:</p>
            <p>
              Theater management requires <code>ROLE_THEATER_OWNER</code>, and film catalog publishing
              requires <code>ROLE_ADMIN</code>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button size="sm" asChild className="w-full sm:w-auto gap-1.5">
              <Link to="/">
                <Home className="size-3.5" />
                <span>Return to Home</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto gap-1.5">
              <Link to="/movies">
                <ArrowLeft className="size-3.5" />
                <span>Browse Movies</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
