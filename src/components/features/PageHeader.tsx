
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4 pb-6 border-b border-border/60', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center text-xs text-muted-foreground">
          <ol className="flex items-center gap-1.5 flex-wrap">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1
              return (
                <li key={index} className="flex items-center gap-1.5">
                  {index > 0 && <ChevronRight className="size-3 text-muted-foreground/60" />}
                  {item.href && !isLast ? (
                    <Link
                      to={item.href}
                      className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(isLast ? 'text-foreground font-medium' : 'text-muted-foreground')}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-heading">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
