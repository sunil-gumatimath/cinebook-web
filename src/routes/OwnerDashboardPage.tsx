import { useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building,
  ChevronRight,
  MapPin,
  Navigation,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'

import { setFormServerErrors, theatersApi } from '@/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CopyIdButton, EmptyState, IdLookup, PageHeader } from '@/components/features'
import { useDocumentTitle } from '@/lib/title'
import { useRecentStore } from '@/store/recent.store'
import type { TheaterRequest } from '@/types/api'

// BACKEND-GAP: GET /theater/mine for owner theater listing (see docs/BACKEND_GAPS.md)

const theaterSchema = z.object({
  name: z.string().trim().min(1, 'Theater name cannot be blank'),
  address: z.string().trim().min(1, 'Address cannot be blank'),
  city: z.string().trim().min(1, 'City cannot be blank'),
  landmark: z.string().trim().min(1, 'Landmark cannot be blank'),
})

type TheaterFormValues = z.infer<typeof theaterSchema>

export function OwnerDashboardPage() {
  useDocumentTitle('Theater Owner Dashboard')
  const navigate = useNavigate()
  const { theaters, saveTheater } = useRecentStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

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
  } = useForm<TheaterFormValues>({
    resolver: zodResolver(theaterSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      landmark: '',
    },
  })

  const onSubmit = async (values: TheaterFormValues) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const payload: TheaterRequest = {
        name: values.name.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        landmark: values.landmark.trim(),
      }

      const res = await theatersApi.register(payload)
      saveTheater({
        theaterId: res.theaterId,
        name: res.name,
        city: res.city,
        address: res.address,
        landmark: res.landmark,
        source: 'created',
      })

      toast.success('Theater registered successfully!')
      reset()
      setDialogOpen(false)
      navigate(`/owner/theaters/${res.theaterId}`)
    } catch (err) {
      const msg = setFormServerErrors(err, setError)
      setServerError(msg || 'Failed to register theater.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Theater Owner Dashboard"
        description="Manage your cinema venues, auditoriums, and schedule movie screenings."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Owner Portal' }]}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 font-semibold">
                <Plus className="size-4" />
                <span>Register Theater</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Register New Theater</DialogTitle>
                <DialogDescription className="text-xs">
                  Create a new theater under your theater owner account. All four fields are required.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pt-2">
                {serverError && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                  >
                    {serverError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor={nameId}>Theater Name</Label>
                  <Input
                    id={nameId}
                    placeholder="e.g. CineBook Grand Central"
                    aria-invalid={errors.name !== undefined}
                    {...register('name')}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={addressId}>Street Address</Label>
                  <Input
                    id={addressId}
                    placeholder="e.g. 123 Cinema Boulevard"
                    aria-invalid={errors.address !== undefined}
                    {...register('address')}
                  />
                  {errors.address && (
                    <p className="text-xs text-destructive">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={cityId}>City</Label>
                  <Input
                    id={cityId}
                    placeholder="e.g. Mumbai"
                    aria-invalid={errors.city !== undefined}
                    {...register('city')}
                  />
                  {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={landmarkId}>Landmark</Label>
                  <Input
                    id={landmarkId}
                    placeholder="e.g. Opposite Central Mall"
                    aria-invalid={errors.landmark !== undefined}
                    {...register('landmark')}
                  />
                  {errors.landmark && (
                    <p className="text-xs text-destructive">{errors.landmark.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? 'Registering…' : 'Register Theater'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Lookup Card */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-4 sm:p-6">
          <div className="max-w-lg">
            <IdLookup
              label="Open Existing Theater by ID"
              placeholder="Paste Theater UUID..."
              buttonText="Manage Theater"
              onLookup={(id) => navigate(`/owner/theaters/${id}`)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Theaters List or Honest Empty State */}
      {theaters.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No registered theaters found"
          description="Theaters you register or look up appear here. Register your cinema venue to start managing screens and scheduling shows."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="size-4" />
              <span>Register Your First Theater</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Section 1: Your theaters (created by this user) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <h3 className="text-lg font-bold font-heading text-foreground">
                Your theaters ({theaters.filter((t) => t.source === 'created').length})
              </h3>
            </div>

            {theaters.filter((t) => t.source === 'created').length === 0 ? (
              <Card className="border-dashed border-2 bg-card/30 p-6 text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  You haven't registered any theaters yet. Register your venue to manage auditoriums and shows.
                </p>
                <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="size-4" />
                  <span>Register Theater</span>
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {theaters
                  .filter((t) => t.source === 'created')
                  .map((t) => (
                    <Card
                      key={t.theaterId}
                      className="cinema-card-lift p-5 flex flex-col justify-between border border-border/70 hover:border-primary/50"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-base line-clamp-1">{t.name || 'Theater'}</h3>
                          <CopyIdButton id={t.theaterId} label="Theater ID" size="xs" variant="ghost" />
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{t.city ? `${t.city}` : 'No city'}</span>
                          </div>
                          {t.address && (
                            <p className="text-xs truncate text-muted-foreground/80">{t.address}</p>
                          )}
                          {t.landmark && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
                              <Navigation className="size-3 shrink-0" />
                              <span className="truncate">Near {t.landmark}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 mt-2 border-t border-border/40 flex items-center justify-between">
                        <Button variant="ghost" size="xs" asChild className="text-xs">
                          <Link to={`/theaters/${t.theaterId}`}>Public View</Link>
                        </Button>
                        <Button size="xs" asChild className="gap-1 text-xs">
                          <Link to={`/owner/theaters/${t.theaterId}`}>
                            <span>Manage</span>
                            <ChevronRight className="size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>

          {/* Section 2: Recently viewed (opened by ID) */}
          {theaters.some((t) => t.source === 'opened') && (
            <div className="space-y-4 pt-4 border-t border-border/70">
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-heading text-foreground">
                  Recently viewed ({theaters.filter((t) => t.source === 'opened').length})
                </h3>
                <p className="text-xs text-muted-foreground">
                                  Theaters you opened by ID. If one of them is yours, open it and enable management.
                                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {theaters
                  .filter((t) => t.source === 'opened')
                  .map((t) => (
                    <Card
                      key={t.theaterId}
                      className="cinema-card-lift p-5 flex flex-col justify-between border border-border/70"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-base line-clamp-1">{t.name || 'Theater'}</h3>
                          <CopyIdButton id={t.theaterId} label="Theater ID" size="xs" variant="ghost" />
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{t.city ? `${t.city}` : 'No city'}</span>
                          </div>
                          {t.address && (
                            <p className="text-xs truncate text-muted-foreground/80">{t.address}</p>
                          )}
                          {t.landmark && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
                              <Navigation className="size-3 shrink-0" />
                              <span className="truncate">Near {t.landmark}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 mt-2 border-t border-border/40 flex items-center justify-between">
                        <Button variant="ghost" size="xs" asChild className="text-xs">
                          <Link to={`/theaters/${t.theaterId}`}>View only</Link>
                        </Button>
                        <Button variant="outline" size="xs" asChild className="text-xs">
                          <Link to={`/owner/theaters/${t.theaterId}`}>Is this yours? Manage</Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
