import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
  id?: string
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Add name and press Enter...',
  disabled = false,
  error,
  className,
  id,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const inputValueRef = useRef(inputValue)
  const valueRef = useRef(value)

  useEffect(() => {
    inputValueRef.current = inputValue
    valueRef.current = value
  }, [inputValue, value])

  const handleAdd = useCallback(() => {
    // Prefer the live DOM value so a value typed but not yet flushed to state
    // (e.g. submitting the form immediately after typing) is still captured.
    const raw = inputRef.current?.value ?? inputValueRef.current
    const trimmed = raw.trim()
    if (!trimmed) return

    // De-duplicate case-insensitively while preserving original case
    if (!valueRef.current.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...valueRef.current, trimmed])
    }
    setInputValue('')
  }, [onChange])

  useEffect(() => {
    const form = inputRef.current?.closest('form')
    if (!form) return

    const handleFormSubmit = () => {
      handleAdd()
    }

    form.addEventListener('submit', handleFormSubmit)
    return () => form.removeEventListener('submit', handleFormSubmit)
  }, [handleAdd])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAdd()
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const handleRemove = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          id={id}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAdd}
          placeholder={placeholder}
          disabled={disabled}
          className="h-9 text-sm"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || !inputValue.trim()}
          className="h-9 gap-1"
        >
          <Plus className="size-3.5" />
          <span>Add</span>
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((tag, idx) => (
            <Badge
              key={`${tag}-${idx}`}
              variant="secondary"
              className="gap-1 px-2.5 py-0.5 text-xs font-normal"
            >
              <span>{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors focus-visible:outline-hidden"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="size-3 text-muted-foreground" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
