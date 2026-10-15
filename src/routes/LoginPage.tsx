import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Film, LogIn } from 'lucide-react'

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
import { useLogin } from '@/hooks'
import { useDocumentTitle } from '@/lib/title'
import { useAuthStore } from '@/store/auth.store'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  // Backend requires non-blank; do not block passwords < 8 chars created before rules changed
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  useDocumentTitle('Sign In')
  const emailId = useId()
  const passwordId = useId()

  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const rawState = location.state as { email?: string; from?: string | { pathname: string } } | null
  const prefillEmail = rawState?.email ?? ''
  const requestedFrom =
    typeof rawState?.from === 'object' && rawState?.from
      ? rawState.from.pathname
      : typeof rawState?.from === 'string'
        ? rawState.from
        : null

  const isAuthenticated = useAuthStore((s) => s.token !== null)
  const currentRole = useAuthStore((s) => s.role)

  useEffect(() => {
    if (isAuthenticated) {
      const defaultDest =
        currentRole === 'ROLE_THEATER_OWNER' ? '/owner' : currentRole === 'ROLE_ADMIN' ? '/admin' : '/movies'
      navigate(requestedFrom && requestedFrom !== '/login' && requestedFrom !== '/register' ? requestedFrom : defaultDest, {
        replace: true,
      })
    }
  }, [isAuthenticated, currentRole, navigate, requestedFrom])

  const { mutate, isPending, error } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: prefillEmail, password: '' },
  })

  const onSubmit = (values: LoginValues) => {
    mutate(values, {
      onSuccess: () => {
        // Check role after login to route to appropriate landing page
        const role = useAuthStore.getState().role

        let target = '/movies'
        if (requestedFrom && requestedFrom !== '/' && requestedFrom !== '/login' && requestedFrom !== '/register') {
          target = requestedFrom
        } else if (role === 'ROLE_THEATER_OWNER') {
          target = '/owner'
        } else if (role === 'ROLE_ADMIN') {
          target = '/admin'
        } else {
          target = '/movies'
        }

        navigate(target, { replace: true })
      },
    })
  }

  return (
    <div className="mx-auto max-w-md py-6">
      <Card className="border-border/80 shadow-lg">
        <CardHeader className="space-y-1.5 pb-6">
          <div className="flex items-center gap-2 text-primary pb-1">
            <Film className="size-5" />
            <span className="font-semibold text-xs tracking-wider uppercase">Welcome Back</span>
          </div>
          <CardTitle className="text-2xl font-bold font-heading">Sign in to your account</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {error instanceof Error && error.message && (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error.message}
              </div>
            )}

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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={passwordId}>Password</Label>
              <div className="relative">
                <Input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3.5 pt-2">
            <Button
              type="submit"
              className="w-full h-10 font-semibold gap-2"
              disabled={isPending}
            >
              <LogIn className="size-4" />
              <span>{isPending ? 'Signing in…' : 'Sign in'}</span>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Create one now
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
