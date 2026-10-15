import React from 'react'
import { Clock } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { parseIsoDuration, toIsoDuration } from '@/lib/duration'
import { cn } from '@/lib/utils'

interface RuntimeInputProps {
  value: string
  onChange: (isoString: string) => void
  disabled?: boolean
  error?: string
  className?: string
  id?: string
}

export function RuntimeInput({
  value,
  onChange,
  disabled = false,
  error,
  className,
  id = 'runtime-input',
}: RuntimeInputProps) {
  const { hours, minutes } = parseIsoDuration(value)

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10)
    const newHours = Number.isNaN(raw) ? 0 : Math.min(24, Math.max(0, raw))
    onChange(toIsoDuration(newHours, minutes))
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10)
    const newMins = Number.isNaN(raw) ? 0 : Math.min(59, Math.max(0, raw))
    onChange(toIsoDuration(hours, newMins))
  }

  const totalMins = hours * 60 + minutes

  return (
    <div className={cn('space-y-1.5', className)} id={id}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <Input
            type="number"
            min={0}
            max={24}
            value={hours === 0 && minutes === 0 ? '' : hours}
            onChange={handleHoursChange}
            placeholder="0"
            disabled={disabled}
            className="w-16 text-center tabular-nums h-9"
            aria-label="Runtime hours"
          />
          <span className="text-xs text-muted-foreground font-medium">hrs</span>

          <Input
            type="number"
            min={0}
            max={59}
            value={minutes === 0 && hours === 0 ? '' : minutes}
            onChange={handleMinutesChange}
            placeholder="0"
            disabled={disabled}
            className="w-16 text-center tabular-nums h-9"
            aria-label="Runtime minutes"
          />
          <span className="text-xs text-muted-foreground font-medium">mins</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md tabular-nums shrink-0">
          <Clock className="size-3.5" />
          <span>{totalMins > 0 ? `${totalMins} min total` : 'Not set'}</span>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
