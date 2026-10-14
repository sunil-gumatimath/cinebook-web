import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, authApi, feedbackApi, moviesApi, theatersApi } from '@/api'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/store/auth.store'
import type {
  AddScreenRequest,
  AddShowRequest,
  CreateFeedbackRequest,
  CreateMovieRequest,
  RegisterRequest,
  RegisterTheaterRequest,
  UpdateUserRequest,
} from '@/types/api'

function toMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

// --------------------------------------------------------------------- users

export function useRegister() {
  return useMutation({
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onSuccess: () => toast.success('Account created. You can now sign in.'),
    onError: (e: unknown) => toast.error(toMessage(e, 'Registration failed.')),
  })
}

export function useUpdateUser() {
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: (body: UpdateUserRequest) => {
      if (userId === null) throw new Error('Not authenticated')
      return authApi.updateUser(userId, body)
    },
    onSuccess: () => toast.success('Profile updated.'),
    onError: (e: unknown) => toast.error(toMessage(e, 'Could not update profile.')),
  })
}

// -------------------------------------------------------------------- movies

export function useMovie(movieId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.movie(movieId ?? ''),
    queryFn: ({ signal }) => moviesApi.getById(movieId as string, signal),
    enabled: Boolean(movieId),
  })
}

export function useCreateMovie() {
  return useMutation({
    mutationFn: (body: CreateMovieRequest) => moviesApi.create(body),
    onSuccess: () => toast.success('Movie added to the catalog.'),
    onError: (e: unknown) => toast.error(toMessage(e, 'Could not create movie.')),
  })
}

// ------------------------------------------------------------------ theaters

export function useTheater(theaterId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.theater(theaterId ?? ''),
    queryFn: ({ signal }) => theatersApi.getById(theaterId as string, signal),
    enabled: Boolean(theaterId),
  })
}

export function useRegisterTheater() {
  return useMutation({
    mutationFn: (body: RegisterTheaterRequest) => theatersApi.register(body),
    onSuccess: () => toast.success('Theater registered.'),
    onError: (e: unknown) => toast.error(toMessage(e, 'Could not register theater.')),
  })
}

export function useAddScreen() {
  return useMutation({
    mutationFn: ({ theaterId, body }: { theaterId: string; body: AddScreenRequest }) =>
      theatersApi.addScreen(theaterId, body),
    onSuccess: () => toast.success('Screen added.'),
    onError: (e: unknown) => toast.error(toMessage(e, 'Could not add screen.')),
  })
}

export function useAddShow() {
  return useMutation({
    mutationFn: ({
      theaterId,
      screenId,
      body,
    }: {
      theaterId: string
      screenId: string
      body: AddShowRequest
    }) => theatersApi.addShow(theaterId, screenId, body),
    onSuccess: () => toast.success('Show scheduled.'),
    onError: (e: unknown) => toast.error(toMessage(e, 'Could not schedule show.')),
  })
}

// ----------------------------------------------------------------- feedback

export function useMovieFeedback(movieId: string | undefined, page = 0, size = 20) {
  return useQuery({
    queryKey: queryKeys.feedback(movieId ?? '', page, size),
    queryFn: ({ signal }) => feedbackApi.listForMovie(movieId as string, page, size, signal),
    enabled: Boolean(movieId),
  })
}

export function useCreateFeedback(movieId: string) {
  return useMutation({
    mutationFn: (body: CreateFeedbackRequest) => feedbackApi.create(movieId, body),
    onSuccess: () => toast.success('Thanks for your feedback!'),
    onError: (e: unknown) => toast.error(toMessage(e, 'Could not submit feedback.')),
  })
}
