import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Edit, Save } from 'lucide-react'
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
import type { TheaterRequest, TheaterResponse } from '@/types/api'

const theaterEditSchema = z.object({
  name: z.string().trim().min(1, 'Theater name cannot be blank'),
  address: z.string().trim().min(1, 'Address cannot be blank'),
  city: z.string().trim().min(1, 'City cannot be blank'),
  landmark: z.string().trim().min(1, 'Landmark cannot be blank'),
})

type TheaterEditValues = z.infer<typeof theaterEditSchema>

interface TheaterDetailsFormProps {
  theater: TheaterResponse
  isForbidden: boolean
  /** Invoked when the backend rejects the write with 403. */
  onForbidden: (message: string) => void
  /** Invoked with the updated theater after a successful PUT. */
  onUpdated: (theater: TheaterResponse) => void
}

/** "Edit Theater Info" card: full four-field update of a theater. */
export function TheaterDetailsForm({
  theater,
  isForbidden,
  onForbidden,
  onUpdated,
}: TheaterDetailsFormProps) {
  const [isUpdatingTheater, setIsUpdatingTheater] = useState(false)
  const [theaterUpdateError, setTheaterUpdateError] = useState<string | null>(null)

  const nameId = useId()
  const addressId = useId()
  const cityId = useId()
  const landmarkId = useId()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TheaterEditValues>({
    resolver: zodResolver(theaterEditSchema),
    defaultValues: { name: '', address: '', city: '', landmark: '' },
  })

  // Prefill whenever the loaded theater changes (initial load and after refetch).
  useEffect(() => {
    reset({
      name: theater.name,
      address: theater.address,
      city: theater.city,
      landmark: theater.landmark,
    })
  }, [theater, reset])

  const onSubmit = async (values: TheaterEditValues) => {
    setIsUpdatingTheater(true)
    setTheaterUpdateError(null)

    try {
      const payload: TheaterRequest = {
        name: values.name.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        landmark: values.landmark.trim(),
      }

      const res = await theatersApi.update(theater.theaterId, payload)
      toast.success('Theater details updated successfully!')
      onUpdated(res)
    } catch (err) {
      if (err instanceof ApiError && err.isForbidden) {
        const msg = "You don't own this theater. Only the theater owner can edit its details."
        onForbidden(msg)
        setTheaterUpdateError(msg)
      } else {
        const msg = setFormServerErrors(err, setError)
        setTheaterUpdateError(msg || 'Failed to update theater.')
      }
    } finally {
      setIsUpdatingTheater(false)
    }
  }

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Edit className="size-4" />
          <span>Full Update</span>
        </div>
        <CardTitle className="text-xl font-bold font-heading">Edit Theater Information</CardTitle>
        <CardDescription className="text-xs">
          Update venue name, street address, city, and landmark. All four fields are required.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {theaterUpdateError && <FormAlert>{theaterUpdateError}</FormAlert>}

          <fieldset disabled={isForbidden} className="space-y-4 disabled:opacity-60">
            <div className="space-y-1.5">
              <Label htmlFor={nameId}>Theater Name</Label>
              <Input id={nameId} aria-invalid={errors.name !== undefined} {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={addressId}>Street Address</Label>
              <Input
                id={addressId}
                aria-invalid={errors.address !== undefined}
                {...register('address')}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={cityId}>City</Label>
              <Input id={cityId} aria-invalid={errors.city !== undefined} {...register('city')} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={landmarkId}>Landmark</Label>
              <Input
                id={landmarkId}
                aria-invalid={errors.landmark !== undefined}
                {...register('landmark')}
              />
              {errors.landmark && (
                <p className="text-xs text-destructive">{errors.landmark.message}</p>
              )}
            </div>
          </fieldset>
        </CardContent>

        <CardFooter className="pt-2 flex justify-end">
          <Button type="submit" size="sm" disabled={isUpdatingTheater || isForbidden} className="gap-2">
            <Save className="size-4" />
            <span>{isUpdatingTheater ? 'Saving…' : 'Save Changes'}</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
