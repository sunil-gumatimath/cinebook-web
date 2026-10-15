import type { LucideIcon } from 'lucide-react'
import { AlertCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

type FormAlertVariant = 'error' | 'warning' | 'info'

const VARIANT_STYLES: Record<FormAlertVariant, string> = {
  error: 'border-destructive/40 bg-destructive/10 text-destructive',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  info: 'border-primary/30 bg-primary/10 text-primary',
}

interface FormAlertProps {
  children: React.ReactNode
  variant?: FormAlertVariant
  /** Pass `null` to render without an icon. */
  icon?: LucideIcon | null
  /** Optional bold heading above the body. */
  title?: string
  className?: string
}

/**
 * Shared inline alert used for form/server errors so the markup and a11y
 * (`role="alert"`) stay consistent across every route.
 */
export function FormAlert({
  children,
  variant = 'error',
  icon: Icon = AlertCircle,
  title,
  className,
}: FormAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-md border p-3 text-xs',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <div className="space-y-0.5">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
