import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyIdButtonProps {
  id: string
  label?: string
  className?: string
  variant?: 'outline' | 'ghost' | 'secondary'
  size?: 'xs' | 'sm' | 'default'
}

export function CopyIdButton({
  id,
  label = 'ID',
  className,
  variant = 'outline',
  size = 'xs',
}: CopyIdButtonProps) {
  const [copied, setCopied] = useState(false)
  const resetTimerRef = useRef<number | null>(null)

  // Clear any pending "copied" reset when the button unmounts.
  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
    }
  }, [])

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      toast.success(`Copied ${label} to clipboard`)
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
      resetTimerRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={`Copy ${label}: ${id}`}
      className={cn('font-mono text-xs gap-1.5 transition-colors', className)}
    >
      {copied ? (
        <Check className="size-3 text-emerald-500" aria-hidden="true" />
      ) : (
        <Copy className="size-3 text-muted-foreground" aria-hidden="true" />
      )}
      <span className="truncate max-w-[120px]">{id}</span>
    </Button>
  )
}
