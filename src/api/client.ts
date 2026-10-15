import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { config } from '@/lib/config'
import { navigateTo } from '@/lib/navigation'
import { useAuthStore } from '@/store/auth.store'
import { useNetworkStore } from '@/store/network.store'
import { readStoredAuth } from './token.storage'

export interface FieldErrorItem {
  field: string
  rejectedValue?: unknown
  errorMessage: string
}

/** Shape of backend error responses from ErrorStructure or FieldErrorStructure. */
export interface ApiErrorBody {
  statusCode?: number
  error_message?: string
  message?: string
  error?: string
  detail?: string
  timestamp?: string
  path?: string
  data?: Array<{
    field?: string
    propertyPath?: string
    rejectedValue?: unknown
    invalidValue?: unknown
    errorMessage?: string
    message?: string
  }>
}

/** A normalized error thrown by every request in this client. */
export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | null
  readonly fieldErrors: { field: string; errorMessage: string }[]

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body

    const errors: { field: string; errorMessage: string }[] = []
    if (body?.data && Array.isArray(body.data)) {
      for (const item of body.data) {
        const fieldName = item.field ?? item.propertyPath
        const errorMsg = item.errorMessage ?? item.message
        if (fieldName && errorMsg) {
          errors.push({ field: fieldName, errorMessage: errorMsg })
        }
      }
    }
    this.fieldErrors = errors
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isValidationError(): boolean {
    return this.status === 400
  }

  get isConflict(): boolean {
    return this.status === 409
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }
}

/**
 * Maps server-side validation fieldErrors onto react-hook-form via setError so
 * validation appears inline under the right inputs.
 * Returns the main error message if present.
 */
export function setFormServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string | null {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : 'An unexpected error occurred'
  }

  if (error.fieldErrors.length > 0) {
    for (const { field, errorMessage } of error.fieldErrors) {
      setError(field as Path<T>, {
        type: 'server',
        message: errorMessage,
      })
    }
  }

  return error.message
}

type QueryValue = string | number | boolean | undefined | null
type QueryParams = Record<string, QueryValue>

function buildUrl(path: string, params?: QueryParams): string {
  const base = config.apiBaseUrl.replace(/\/$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${suffix}`

  if (!params) return url

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  params?: QueryParams
  /** Set false for public endpoints so no Authorization header is attached. */
  auth?: boolean
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, auth = true, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const stored = readStoredAuth()
    if (stored?.token) {
      headers['Authorization'] = `Bearer ${stored.token}`
    }
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    useNetworkStore.getState().setServerDown(true)
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.", null)
  }

  useNetworkStore.getState().setServerDown(false)

  if (response.status === 204) return undefined as T

  const rawText = await response.text()
  let parsed: unknown = null
  if (rawText.length > 0) {
    try {
      parsed = JSON.parse(rawText) as unknown
    } catch {
      // A successful response that is not JSON (e.g. a bare JWT returned as
      // text/plain by a Spring String handler) is surfaced as the raw string
      // rather than null, so callers can still use it.
      parsed = rawText
    }
  }

  if (!response.ok) {
    const errorBody = (parsed ?? null) as ApiErrorBody | null

    // 401 handling: drop session and redirect to /login (except for /login itself)
    if (response.status === 401 && !path.includes('/login')) {
      useAuthStore.getState().logout({ reason: 'Session expired' })
      const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        navigateTo('/login', { replace: true, state: { from: currentPath } })
      }
    }

    const message =
      errorBody?.error_message ??
      errorBody?.message ??
      errorBody?.detail ??
      errorBody?.error ??
      `Request failed with status ${response.status}`

    throw new ApiError(response.status, message, errorBody)
  }

  // Backend wraps successful responses in { status, message, data }.
  // Unwrap it so caller receives data.
  if (
    parsed &&
    typeof parsed === 'object' &&
    'data' in parsed &&
    Object.keys(parsed as object).includes('status')
  ) {
    parsed = (parsed as { data: unknown }).data
  }

  return parsed as T
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}

export { buildUrl }
