import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, Home, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback renderer. */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render/lifecycle errors thrown anywhere below it so a single broken
 * page never blanks the whole app. Mount it high (inside the app shell) and give
 * it a `key` tied to the route so navigation clears the failed state.
 *
 * Error boundaries must be class components — this is the one place we use one.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Replace with a real reporter (Sentry, etc.) before shipping to production.
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  private reset = (): void => {
    this.setState({ error: null })
  }

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset)
    }

    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>

          <div className="max-w-md space-y-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This section failed to render. You can retry, or head back home.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button size="sm" onClick={this.reset} className="gap-1.5">
              <RotateCw className="size-3.5" />
              <span>Try again</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.assign('/')}
              className="gap-1.5"
            >
              <Home className="size-3.5" />
              <span>Go home</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
}
