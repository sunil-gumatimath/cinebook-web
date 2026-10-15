import { useId, useState } from 'react'
import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

interface RatingStarsProps {
  /** Rating value from 0 to 5 */
  value: number
  /** If provided, turns the component into an interactive form control */
  onChange?: (val: number) => void
  /** Read-only display options */
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  id?: string
  disabled?: boolean
}

export function RatingStars({
  value,
  onChange,
  max = 5,
  size = 'md',
  showText = false,
  className,
  id,
  disabled = false,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const isInteractive = Boolean(onChange) && !disabled
  const generatedId = useId()
  const radioPrefix = id || generatedId

  const displayValue = hoverValue !== null ? hoverValue : value

  const starSizeClasses = {
    sm: 'size-3.5',
    md: 'size-4',
    lg: 'size-6',
  }[size]

  return (
    <div
      className={cn('inline-flex items-center gap-1.5', className)}
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={
        isInteractive
          ? `Select rating from 1 to ${max} stars`
          : value > 0
            ? `${value.toFixed(1)} out of ${max} stars`
            : 'No ratings yet'
      }
      id={id}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => {
          const starIndex = i + 1
          const isFilled = displayValue >= starIndex
          const isHalf = !isFilled && displayValue >= starIndex - 0.5
          const isRovingFocus = value ? value === starIndex : starIndex === 1

          if (isInteractive) {
            return (
              <button
                key={starIndex}
                id={`${radioPrefix}-star-${starIndex}`}
                type="button"
                role="radio"
                aria-checked={value === starIndex}
                aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
                tabIndex={isRovingFocus ? 0 : -1}
                disabled={disabled}
                onClick={() => onChange?.(starIndex)}
                onMouseEnter={() => setHoverValue(starIndex)}
                onMouseLeave={() => setHoverValue(null)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    e.preventDefault()
                    const next = Math.min(max, (value || 0) + 1)
                    onChange?.(next)
                    document.getElementById(`${radioPrefix}-star-${next}`)?.focus()
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    e.preventDefault()
                    const prev = Math.max(1, (value || 2) - 1)
                    onChange?.(prev)
                    document.getElementById(`${radioPrefix}-star-${prev}`)?.focus()
                  }
                }}
                className={cn(
                  'rounded-xs p-0.5 text-muted-foreground/40 transition-transform hover:scale-110 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
                  (isFilled || isHalf) && 'text-amber-400 dark:text-amber-300',
                )}
              >
                <Star
                  className={cn(
                    starSizeClasses,
                    isFilled ? 'fill-current' : isHalf ? 'fill-current opacity-50' : 'fill-none',
                  )}
                />
              </button>
            )
          }

          return (
            <Star
              key={starIndex}
              className={cn(
                starSizeClasses,
                isFilled
                  ? 'fill-amber-400 text-amber-400 dark:fill-amber-300 dark:text-amber-300'
                  : isHalf
                    ? 'fill-amber-400/50 text-amber-400 dark:fill-amber-300/50 dark:text-amber-300'
                    : 'fill-none text-muted-foreground/30',
              )}
              aria-hidden="true"
            />
          )
        })}
      </div>

      {showText && (
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {value > 0 ? (
            <span className="text-foreground font-semibold">{value.toFixed(1)}</span>
          ) : (
            'No ratings yet'
          )}
        </span>
      )}
    </div>
  )
}
