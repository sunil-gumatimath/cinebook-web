import { useMemo, useState } from 'react'
import { Armchair, Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatScreenType } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { ScreenType, SeatResponse } from '@/types/api'

interface SeatMapProps {
  screenType: ScreenType
  capacity: number
  noOfRows: number
  seatResponses: SeatResponse[]
  className?: string
}

interface ParsedSeat {
  seatId: string
  seatName: string
  row: string
  number: number
}

export function SeatMap({
  screenType,
  capacity,
  noOfRows,
  seatResponses = [],
  className,
}: SeatMapProps) {
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set())
  const [activeSeatId, setActiveSeatId] = useState<string | null>(null)

  // Parse and organize seats into ordered rows
  const { rowMap, sortedRows, seatLookup, firstSeatId } = useMemo(() => {
    const rows: Record<string, ParsedSeat[]> = {}
    const lookup = new Map<string, ParsedSeat>()

    for (const seat of seatResponses) {
      const match = seat.seatName.match(/^([A-Za-z]+)(\d+)$/)
      const row = match?.[1] ? match[1].toUpperCase() : 'A'
      const number = match?.[2] ? parseInt(match[2], 10) : 1

      const parsed: ParsedSeat = {
        seatId: seat.seatId,
        seatName: seat.seatName,
        row,
        number,
      }

      if (!rows[row]) rows[row] = []
      rows[row]?.push(parsed)
      lookup.set(seat.seatId, parsed)
    }

    // Sort each row by seat number
    for (const r of Object.keys(rows)) {
      const list = rows[r]
      if (list) {
        list.sort((a, b) => a.number - b.number)
      }
    }

    // Sort row keys alphabetically
    const sorted = Object.keys(rows).sort()
    const firstRowKey = sorted[0]
    const firstRowSeats = firstRowKey ? rows[firstRowKey] : undefined
    const firstId = firstRowSeats?.[0]?.seatId ?? null

    return { rowMap: rows, sortedRows: sorted, seatLookup: lookup, firstSeatId: firstId }
  }, [seatResponses])

  const effectiveActiveSeatId = activeSeatId ?? firstSeatId

  const toggleSeat = (seatId: string) => {
    setActiveSeatId(seatId)
    setSelectedSeatIds((prev) => {
      const next = new Set(prev)
      if (next.has(seatId)) {
        next.delete(seatId)
      } else {
        next.add(seatId)
      }
      return next
    })
  }

  // Keyboard navigation across the grid (roving tabindex)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    rowIndex: number,
    seatIndex: number,
  ) => {
    let targetRow = rowIndex
    let targetSeat = seatIndex

    const currentRowKey = sortedRows[rowIndex]
    const currentRowSeats = currentRowKey ? rowMap[currentRowKey] : undefined

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (currentRowSeats) {
        targetSeat = Math.min(currentRowSeats.length - 1, seatIndex + 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      targetSeat = Math.max(0, seatIndex - 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      targetRow = Math.min(sortedRows.length - 1, rowIndex + 1)
      const targetRowKey = sortedRows[targetRow]
      const targetRowSeats = targetRowKey ? rowMap[targetRowKey] : undefined
      if (targetRowSeats) {
        targetSeat = Math.min(targetRowSeats.length - 1, seatIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      targetRow = Math.max(0, rowIndex - 1)
      const targetRowKey = sortedRows[targetRow]
      const targetRowSeats = targetRowKey ? rowMap[targetRowKey] : undefined
      if (targetRowSeats) {
        targetSeat = Math.min(targetRowSeats.length - 1, seatIndex)
      }
    } else {
      return
    }

    const targetRowKey = sortedRows[targetRow]
    const nextSeat = targetRowKey ? rowMap[targetRowKey]?.[targetSeat] : undefined
    if (nextSeat) {
      setActiveSeatId(nextSeat.seatId)
      const el = document.getElementById(`seat-btn-${nextSeat.seatId}`)
      el?.focus()
    }
  }

  const selectedSeatsList = Array.from(selectedSeatIds)
    .map((id) => seatLookup.get(id))
    .filter((s): s is ParsedSeat => s !== undefined)
    .sort((a, b) => a.seatName.localeCompare(b.seatName))

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Badges */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-semibold text-xs tracking-wider">
            {formatScreenType(screenType)}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            {capacity} Seats · {noOfRows} Rows
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-xs border border-border bg-card" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-xs bg-primary text-primary-foreground" />
            <span>Selected</span>
          </div>
        </div>
      </div>

      {/* Screen Curved Indicator */}
      <div className="flex flex-col items-center justify-center pt-2 pb-6">
        <div className="w-full max-w-lg">
          <div className="h-2 w-full rounded-t-full bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-lg shadow-primary/30" />
          <p className="mt-2 text-center text-xs font-semibold tracking-widest uppercase text-muted-foreground/80">
            All Eyes This Way · Screen
          </p>
        </div>
      </div>

      {/* Seat Grid - Horizontally scrollable on small screens */}
      <div
        className="overflow-x-auto pb-4 pt-2"
        role="region"
        aria-label="Seat map grid"
      >
        <div className="inline-block min-w-full text-center">
          <div className="flex flex-col items-center gap-2" role="group" aria-label="Auditorium seats">
            {sortedRows.map((rowLetter, rowIndex) => {              const seatsInRow = rowMap[rowLetter] || []
              return (
                <div key={rowLetter} className="flex items-center gap-2 sm:gap-3">
                  {/* Left row label */}
                  <span
                    className="w-5 text-right font-mono text-xs font-semibold text-muted-foreground select-none"
                    aria-hidden="true"
                  >
                    {rowLetter}
                  </span>

                  {/* Seat buttons */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {seatsInRow.map((seat, seatIndex) => {
                      const isSelected = selectedSeatIds.has(seat.seatId)
                      const isRovingFocus = effectiveActiveSeatId === seat.seatId

                      return (
                        <button
                          key={seat.seatId}
                          id={`seat-btn-${seat.seatId}`}
                          type="button"
                          tabIndex={isRovingFocus ? 0 : -1}
                          onClick={() => toggleSeat(seat.seatId)}
                          onFocus={() => setActiveSeatId(seat.seatId)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, seatIndex)}
                          aria-label={`Seat ${seat.seatName}, ${isSelected ? 'Selected' : 'Available'}`}
                          aria-pressed={isSelected}
                          className={cn(
                            'seat-pop group relative flex size-7 sm:size-8 items-center justify-center rounded-xs text-xs font-semibold tabular-nums border transition-all select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground shadow-xs font-bold'
                              : 'bg-card border-border text-card-foreground hover:border-primary/50 hover:bg-muted/60',
                          )}
                        >
                          <span className="sr-only">Seat</span>
                          <span>{seat.number}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Right row label */}
                  <span
                    className="w-5 text-left font-mono text-xs font-semibold text-muted-foreground select-none"
                    aria-hidden="true"
                  >
                    {rowLetter}
                  </span>
                </div>
              )
            })}
          </div>

          {sortedRows.length === 0 && (
            <p className="py-10 text-sm text-muted-foreground">
              No seat layout is available for this screen yet.
            </p>
          )}
        </div>
      </div>

      {/* Summary and Selection Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Armchair className="size-4 text-primary" />
            <span className="text-sm font-semibold">
              Selected Seats ({selectedSeatIds.size})
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedSeatsList.length > 0
              ? selectedSeatsList.map((s) => s.seatName).join(', ')
              : 'Click or focus seats to preview selection'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedSeatIds.size > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSeatIds(new Set())}
              className="text-xs h-8"
            >
              Clear
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <div tabIndex={0} className="inline-block">
                <Button
                  disabled
                  size="sm"
                  className="gap-1.5 h-8 opacity-70 cursor-not-allowed"
                >
                  <span>Book {selectedSeatIds.size > 0 ? `(${selectedSeatIds.size})` : ''}</span>
                  <Info className="size-3.5" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              Seat selection is for preview. Online reservation is currently unavailable.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
