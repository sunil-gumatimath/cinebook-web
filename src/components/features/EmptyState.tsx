
import type { LucideIcon } from 'lucide-react'
import { Info } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  backendGap?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = Info,
  title,
  description,
  backendGap: _backendGap,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed border-2 bg-card/40 text-center', className)}>
      <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 space-y-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>

        {/* Note: backendGap prop is retained for developer documentation/code comments but omitted from user-visible UI */}

        {action && <div className="pt-2">{action}</div>}
      </CardContent>
    </Card>
  )
}
