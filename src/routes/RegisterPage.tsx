import { useEffect, useId, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Eye, EyeOff, Film, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'

import { authApi, cacheUsername, setFormServerErrors } from '@/api'
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
import { getTodayLocalDateString, isPastLocalDate } from '@/lib/date'
import { useDocumentTitle } from '@/lib/title'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import type { RegisterRequest } from '@/types/api'

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username cannot be blank')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscore'),
  email: z
    .string()
    .trim()
    .min(1, 'Email cannot be blank')
    .regex(/^[A-Za-z0-9._%+-]+@gmail\.com$/i, 'Use a Gmail address (@gmail.com)'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number cannot be blank')
    .regex(/^[7-9]\d{9}$/, 'Must be a valid 10-digit phone number starting with 7, 8, or 9'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must not exceed 64 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/,
      'Password must include uppercase, lowercase, number, and special character',
    ),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => isPastLocalDate(val), {
      message: 'Date of birth must be a past date',
    }),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  useDocumentTitle('Create Account')
  const navigate = useNavigate()

  const isAuthenticated = useAuthStore((s) => s.token !== null)
  const currentRole = useAuthStore((s) => s.role)

  useEffect(() => {
    if (isAuthenticated) {
      const defaultDest =
        currentRole === 'ROLE_THEATER_OWNER' ? '/owner' : currentRole === 'ROLE_ADMIN' ? '/admin' : '/movies'
      navigate(defaultDest, { replace: true })
    }
  }, [isAuthenticated, currentRole, navigate])

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const usernameId = useId()
  const emailId = useId()
  const phoneId = useId()
  const passwordId = useId()
  const dobId = useId()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      phoneNumber: '',
      password: '',
      dateOfBirth: '',
    },
  })

  const passwordValue = useWatch({ control, name: 'password' }) || ''

  const passwordChecks = [
    { label: '8 to 64 characters', valid: passwordValue.length >= 8 && passwordValue.length <= 64 },
    { label: 'At least one uppercase letter (A-Z)', valid: /[A-Z]/.test(passwordValue) },
    { label: 'At least one lowercase letter (a-z)', valid: /[a-z]/.test(passwordValue) },
    { label: 'At least one number (0-9)', valid: /\d/.test(passwordValue) },
    { label: 'At least one special character (!@#$...)', valid: /[^A-Za-z0-9]/.test(passwordValue) },
  ]

  const onSubmit = async (values: RegisterValues) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const payload: RegisterRequest = {
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        phoneNumber: values.phoneNumber.trim(),
        password: values.password,
        dateOfBirth: values.dateOfBirth,
      }

      const res = await authApi.register(payload)
      if (res?.userId && res?.username) {
        cacheUsername(res.userId, res.username)
        cacheUsername(res.email, res.username)
      }

      toast.success('Account created! Please sign in with your credentials.')
      navigate('/login', {
        state: { email: values.email.trim() },
        replace: true,
      })
    } catch (err) {
      const mainMessage = setFormServerErrors(err, setError)
      setServerError(mainMessage || 'Registration failed. Please check your details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg py-4">
      <Card className="border-border/80 shadow-lg">
        <CardHeader className="space-y-1.5 pb-6">
          <div className="flex items-center gap-2 text-primary pb-1">
            <Film className="size-5" />
            <span className="font-semibold text-xs tracking-wider uppercase">Join CineBook</span>
          </div>
          <CardTitle className="text-2xl font-bold font-heading">Create your account</CardTitle>
          <CardDescription>
            Enjoy movie details, ratings, and auditorium seat maps.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {serverError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {serverError}
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor={usernameId}>Username</Label>
              <Input
                id={usernameId}
                type="text"
                autoComplete="username"
                placeholder="e.g. movie_fan99"
                aria-invalid={errors.username !== undefined}
                {...register('username')}
              />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Letters, numbers, and underscores only.
              </p>
            </div>

            {/* Email (Gmail only) */}
            <div className="space-y-1.5">
              <Label htmlFor={emailId}>Email Address</Label>
              <Input
                id={emailId}
                type="email"
                autoComplete="email"
                placeholder="you@gmail.com"
                aria-invalid={errors.email !== undefined}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Use a Gmail address (@gmail.com).
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor={phoneId}>Phone Number</Label>
              <Input
                id={phoneId}
                type="tel"
                autoComplete="tel"
                placeholder="10-digit number starting with 7, 8, or 9"
                aria-invalid={errors.phoneNumber !== undefined}
                {...register('phoneNumber')}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <Label htmlFor={dobId}>Date of Birth</Label>
              <Input
                id={dobId}
                type="date"
                max={getTodayLocalDateString()}
                aria-invalid={errors.dateOfBirth !== undefined}
                {...register('dateOfBirth')}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Must be a past date.</p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor={passwordId}>Password</Label>
              <div className="relative">
                <Input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  className="pr-10"
                  aria-invalid={errors.password !== undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-hidden"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}

              {/* Live Password Checklist */}
              <div className="mt-2.5 rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <ShieldCheck className="size-3.5 text-primary" />
                  <span>Password Requirements:</span>
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs pt-1 sm:grid-cols-2">
                  {passwordChecks.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center gap-1.5 transition-colors',
                        item.valid ? 'text-emerald-500 font-medium' : 'text-muted-foreground',
                      )}
                    >
                      {item.valid ? (
                        <Check className="size-3 shrink-0" />
                      ) : (
                        <X className="size-3 shrink-0 opacity-40" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3.5 pt-2">
            <Button type="submit" className="w-full h-10 font-semibold" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
