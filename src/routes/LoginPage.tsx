import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'

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
import { useLogin } from '@/hooks/useLogin'

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const emailId = useId()
  const passwordId = useId()

  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  const { mutate, isPending, error } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = (values: LoginValues) => {
    mutate(values, { onSuccess: () => navigate(redirectTo, { replace: true }) })
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your bookings and manage your account.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={emailId}>Email</Label>
              <Input
                id={emailId}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={errors.email !== undefined}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={passwordId}>Password</Label>
              <Input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password !== undefined}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {error instanceof Error && error.message && (
              <p role="alert" className="text-sm text-destructive">
                {error.message}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-sm text-muted-foreground">
              No account?{' '}
              <Link to="/register" className="underline underline-offset-4">
                Create one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
