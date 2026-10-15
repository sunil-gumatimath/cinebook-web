import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { AlertTriangle, Home, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Router-level safety net. Wired as `errorElement` on the root route so that
 * errors thrown outside the React tree React Query/ErrorBoundary can see —
 * route loader/render failures, failed lazy chunks — still produce a real page
 * instead of React Router's default developer screen.
 */
export function RouteErrorElement() {
  const error = useRouteError()

  const isHttpError = isRouteErrorResponse(error)
  const title = isHttpError ? `${error.status} ${error.statusText}` : 'Something went wrong'
  const detail = isHttpError
    ? error.status === 404
      ? 'The page you requested could not be found.'
      : 'The server could not complete this request.'
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-md border-destructive/40 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight font-heading">{title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button size="sm" onClick={() => window.location.reload()} className="gap-1.5">
              <RotateCw className="size-3.5" />
              <span>Reload</span>
            </Button>
            <Button size="sm" variant="outline" asChild className="gap-1.5">
              <Link to="/">
                <Home className="size-3.5" />
                <span>Go home</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
