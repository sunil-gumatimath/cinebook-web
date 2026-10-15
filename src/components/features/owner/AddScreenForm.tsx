import { useId, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Armchair, CheckCircle2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, setFormServerErrors, theatersApi } from '@/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/features'
import { formatScreenType } from '@/lib/labels'
import { useRecentStore } from '@/store/recent.store'
import type { ScreenRequest } from '@/types/api'
import { SCREEN_TYPES } from '@/types/api'

const addScreenSchema = z
  .object({
    screenType: z.enum(SCREEN_TYPES, { message: 'Select a valid screen type' }),
    capacity: z
      .number()
      .min(1, 'Capacity must be at least 1')
      .max(1000, 'Capacity cannot exceed 1000'),
    noOfRows: z
      .number()
      .min(1, 'Rows must be at least 1')
      .max(26, 'Rows cannot exceed 26 (A to Z)'),
  })
  .refine((data) => data.capacity % data.noOfRows === 0, {
    message: 'Capacity must be evenly divisible by number of rows',
    path: ['capacity'],
  })

type AddScreenValues = z.infer<typeof addScreenSchema>

const EMPTY_FORM: AddScreenValues = {
  screenType: 'TWO_D',
  capacity: 120,
  noOfRows: 10,
}

interface AddScreenFormProps {
  theaterId: string
  isForbidden: boolean
  /** Invoked when the backend rejects the write with 403. */
  onForbidden: (message: string) => void
}

/** "Add Screen" card with the segmented type selector and mini seat-grid preview. */
export function AddScreenForm({ theaterId, isForbidden, onForbidden }: AddScreenFormProps) {
  const saveScreen = useRecentStore((s) => s.saveScreen)

  const [isAddingScreen, setIsAddingScreen] = useState(false)
  const [screenAddError, setScreenAddError] = useState<string | null>(null)

  const capacityId = useId()
  const rowsId = useId()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddScreenValues>({
    resolver: zodResolver(addScreenSchema),
    defaultValues: EMPTY_FORM,
  })

  const watchedType = useWatch({ control, name: 'screenType' })
  const watchedCapacity = Number(useWatch({ control, name: 'capacity' })) || 0
  const watchedRows = Number(useWatch({ control, name: 'noOfRows' })) || 0

  const seatsPerRow =
    watchedRows > 0 && watchedCapacity > 0 && watchedCapacity % watchedRows === 0
      ? Math.floor(watchedCapacity / watchedRows)
      : null

  const onSubmit = async (values: AddScreenValues) => {
    setIsAddingScreen(true)
    setScreenAddError(null)

    try {
      const payload: ScreenRequest = {
        screenType: values.screenType,
        capacity: values.capacity,
        noOfRows: values.noOfRows,
      }

      const res = await theatersApi.addScreen(theaterId, payload)
      saveScreen({
        screenId: res.screenId,
        theaterId,
        screenType: res.screenType,
        capacity: res.capacity,
        noOfRows: res.noOfRows,
      })

      toast.success(`Screen ${res.screenType} (${res.capacity} seats) created!`)
      reset(EMPTY_FORM)
    } catch (err) {
      if (err instanceof ApiError && err.isForbidden) {
        const msg = "You don't own this theater. Only the theater owner can add screens."
        onForbidden(msg)
        setScreenAddError(msg)
      } else {
        const msg = setFormServerErrors(err, setError)
        setScreenAddError(msg || 'Failed to create screen.')
      }
    } finally {
      setIsAddingScreen(false)
    }
  }

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Plus className="size-4" />
          <span>New Auditorium</span>
        </div>
        <CardTitle className="text-xl font-bold font-heading">Add Screen</CardTitle>
        <CardDescription className="text-xs">
          Configure screen type and layout. Rows will be lettered from A to Z; seats per row must
          divide capacity evenly.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-5">
          {screenAddError && <FormAlert>{screenAddError}</FormAlert>}

          <fieldset disabled={isForbidden} className="space-y-5 disabled:opacity-60">
            {/* Segmented Screen Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Screen Type</label>
              <div className="grid grid-cols-3 gap-2">
                {SCREEN_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue('screenType', type, { shouldValidate: true })}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all select-none ${
                      watchedType === type
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <Armchair className="size-4 mb-1" />
                    <span>{formatScreenType(type)}</span>
                  </button>
                ))}
              </div>
              {errors.screenType && (
                <p className="text-xs text-destructive">{errors.screenType.message}</p>
              )}
            </div>

            {/* Capacity & Rows */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={capacityId}>Total Capacity (1–1000)</Label>
                <Input
                  id={capacityId}
                  type="number"
                  min={1}
                  max={1000}
                  aria-invalid={errors.capacity !== undefined}
                  {...register('capacity', { valueAsNumber: true })}
                />
                {errors.capacity && (
                  <p className="text-xs text-destructive">{errors.capacity.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={rowsId}>Number of Rows (1–26, A–Z)</Label>
                <Input
                  id={rowsId}
                  type="number"
                  min={1}
                  max={26}
                  aria-invalid={errors.noOfRows !== undefined}
                  {...register('noOfRows', { valueAsNumber: true })}
                />
                {errors.noOfRows && (
                  <p className="text-xs text-destructive">{errors.noOfRows.message}</p>
                )}
              </div>
            </div>

            {/* Live Preview Info & Mini Grid */}
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Layout Calculation:</span>
                <span className="font-semibold text-foreground">
                  {seatsPerRow !== null ? (
                    <span className="text-emerald-500 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="size-3.5" />
                      <span>
                        {watchedCapacity} seats = {watchedRows} rows × {seatsPerRow} seats/row
                      </span>
                    </span>
                  ) : (
                    <span className="text-destructive font-mono">
                      Capacity must divide rows evenly
                    </span>
                  )}
                </span>
              </div>

              {/* Mini seat-grid preview */}
              {seatsPerRow !== null && watchedRows > 0 && (
                <div className="pt-2 border-t border-border/40">
                  <p className="text-xs text-muted-foreground pb-2 text-center uppercase tracking-wider font-semibold">
                    Mini Grid Preview
                  </p>
                  <div className="flex flex-col items-center gap-1 overflow-x-auto p-2">
                    {Array.from({ length: Math.min(watchedRows, 6) }, (_, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-1">
                        <span className="font-mono text-xs text-muted-foreground w-3 text-right">
                          {String.fromCharCode(65 + rIdx)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: Math.min(seatsPerRow, 16) }, (_, cIdx) => (
                            <span
                              key={cIdx}
                              className="size-2 rounded-xs bg-primary/40 border border-primary/60"
                            />
                          ))}
                          {seatsPerRow > 16 && (
                            <span className="text-xs text-muted-foreground px-1">…</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {watchedRows > 6 && (
                      <span className="text-xs text-muted-foreground">
                        + {watchedRows - 6} more rows…
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </fieldset>
        </CardContent>

        <CardFooter className="pt-2 flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isAddingScreen || seatsPerRow === null || isForbidden}
            className="gap-2"
          >
            <Plus className="size-4" />
            <span>{isAddingScreen ? 'Creating Screen…' : 'Create Screen'}</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
