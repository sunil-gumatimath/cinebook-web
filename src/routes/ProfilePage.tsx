import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertTriangle,
  Save,
  Shield,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { authApi, setFormServerErrors } from '@/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
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
import { CopyIdButton, FormAlert, PageHeader } from '@/components/features'
import { getYesterdayLocalDateString, isPastLocalDate } from '@/lib/date'
import { useDocumentTitle } from '@/lib/title'
import { useAuthStore } from '@/store/auth.store'
import { purgeUserData } from '@/store/recent.store'
import { formatRole } from '@/types/api'

// BACKEND-GAP: GET /users/me for user profile prefill

const profileUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username cannot be blank')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscore'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number cannot be blank')
    .regex(/^[7-9]\d{9}$/, 'Must be a valid 10-digit phone number starting with 7, 8, or 9'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => isPastLocalDate(val), {
      message: 'Date of birth must be a past date',
    }),
})

type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>

export function ProfilePage() {
  useDocumentTitle('Account Profile')
  const navigate = useNavigate()

  const userId = useAuthStore((s) => s.userId)
  const username = useAuthStore((s) => s.username)
  const email = useAuthStore((s) => s.email)
  const role = useAuthStore((s) => s.role)
  const setUsername = useAuthStore((s) => s.setUsername)
  const logout = useAuthStore((s) => s.logout)

  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Delete account state
  const [deleteConfirmationEmail, setDeleteConfirmationEmail] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const usernameInputId = useId()
  const phoneInputId = useId()
  const dobInputId = useId()

  const initialUsername =
    username && /^[a-zA-Z0-9_]+$/.test(username) && (!email || username !== email.split('@')[0])
      ? username
      : ''

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      username: initialUsername,
      phoneNumber: '',
      dateOfBirth: '',
    },
  })

  const onUpdateProfile = async (values: ProfileUpdateValues) => {
    if (!userId) {
      toast.error('No user ID available for this session')
      return
    }

    setIsUpdating(true)
    setUpdateError(null)

    try {
      const res = await authApi.updateUser(userId, {
        username: values.username.trim(),
        phoneNumber: values.phoneNumber.trim(),
        dateOfBirth: values.dateOfBirth,
      })

      if (res?.username) {
        setUsername(res.username)
      }
      toast.success('Profile updated successfully!')
    } catch (err) {
      const msg = setFormServerErrors(err, setError)
      setUpdateError(msg || 'Failed to update profile.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!userId) return
    setIsDeleting(true)
    try {
      await authApi.deleteUser(userId)
      toast.success('Account successfully deleted.')
      purgeUserData(userId)
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account')
      setIsDeleting(false)
    }
  }

  const canConfirmDelete =
    deleteConfirmationEmail.trim().toLowerCase() === (email || '').trim().toLowerCase()

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <PageHeader
        title="Account Profile"
        description="View your active session credentials, update profile details, or manage account lifecycle."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Profile' }]}
      />

      {/* Account Overview Card */}
      <Card className="border border-border/80">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
            <UserIcon className="size-4" />
            <span>Active Session</span>
          </div>
          <CardTitle className="text-xl font-bold font-heading">User Information</CardTitle>
          <CardDescription className="text-xs">
            Extracted from your authenticated session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Username</span>
              <p className="font-semibold text-foreground">{username || 'Not set'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Email Address</span>
              <p className="font-semibold text-foreground font-mono text-xs">{email || 'Not set'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Assigned Role</span>
              <div>
                <Badge variant="secondary" className="gap-1.5 font-medium">
                  <Shield className="size-3" />
                  <span>{formatRole(role)}</span>
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">User ID</span>
              <div>{userId ? <CopyIdButton id={userId} label="User ID" /> : '—'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card className="border border-border/80">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
            <Save className="size-4" />
            <span>Edit Information</span>
          </div>
          <CardTitle className="text-xl font-bold font-heading">Update Profile</CardTitle>
          <CardDescription className="text-xs">
            Please provide your username, contact phone number, and date of birth to update your profile.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onUpdateProfile)} noValidate>
          <CardContent className="space-y-4 pt-4">
            {updateError && <FormAlert>{updateError}</FormAlert>}

            <div className="space-y-1.5">
              <Label htmlFor={usernameInputId}>New / Updated Username</Label>
              <Input
                id={usernameInputId}
                placeholder="letters, numbers, underscore"
                aria-invalid={errors.username !== undefined}
                {...register('username')}
              />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={phoneInputId}>Phone Number</Label>
              <Input
                id={phoneInputId}
                type="tel"
                placeholder="10 digits starting with 7, 8, or 9"
                aria-invalid={errors.phoneNumber !== undefined}
                {...register('phoneNumber')}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={dobInputId}>Date of Birth</Label>
              <Input
                id={dobInputId}
                type="date"
                max={getYesterdayLocalDateString()}
                aria-invalid={errors.dateOfBirth !== undefined}
                {...register('dateOfBirth')}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex justify-end">
            <Button type="submit" disabled={isUpdating} className="gap-2">
              <Save className="size-4" />
              <span>{isUpdating ? 'Saving…' : 'Save Changes'}</span>
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Danger Zone: Soft Delete Account */}
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="size-4" />
            <span>Danger Zone</span>
          </div>
          <CardTitle className="text-lg text-destructive font-bold">Delete Account</CardTitle>
          <CardDescription className="text-xs">
            Soft-delete your user account. Once deleted, your account will be deactivated and you
            will be logged out immediately.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-end pt-2">
          <AlertDialog
            onOpenChange={(open) => {
              // Clear the typed confirmation whenever the dialog closes (cancel,
              // Escape, or overlay click) so a reopened dialog can't delete in one click.
              if (!open) {
                setDeleteConfirmationEmail('')
                setIsDeleting(false)
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="size-4" />
                <span>Delete Account</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3 text-xs leading-relaxed">
                  <span>
                    This action will deactivate your account and log you out immediately.
                    To confirm, please type your email address (<strong>{email}</strong>) below:
                  </span>
                  <Input
                    value={deleteConfirmationEmail}
                    onChange={(e) => setDeleteConfirmationEmail(e.target.value)}
                    placeholder="Type your email to confirm..."
                    className="mt-2 text-xs font-mono"
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmationEmail('')}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={!canConfirmDelete || isDeleting}
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting…' : 'I understand, delete my account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  )
}
