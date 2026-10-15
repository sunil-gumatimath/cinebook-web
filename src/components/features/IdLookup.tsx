import { useId, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface IdLookupProps {
  label?: string
  placeholder: string
  buttonText?: string
  onLookup: (id: string) => void
  isLoading?: boolean
  className?: string
  autoFocus?: boolean
}

export function IdLookup({
  label,
  placeholder,
  buttonText = 'Open',
  onLookup,
  isLoading = false,
  className,
  autoFocus = false,
}: IdLookupProps) {
  const [value, setValue] = useState('')
  const inputId = useId()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) {
      onLookup(trimmed)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            id={inputId}
            aria-label={label ? undefined : placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="pl-9 pr-3 h-9 text-sm"
            autoFocus={autoFocus}
            spellCheck={false}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          className="h-9 gap-1.5 px-3.5"
          disabled={!value.trim() || isLoading}
        >
          <span>{isLoading ? 'Opening…' : buttonText}</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </form>
  )
}
