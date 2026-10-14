import { config } from '@/lib/config'
import { clearStoredAuth, readStoredAuth } from './token.storage'

/** Shape of Spring's ProblemDetail / error responses. */
export interface ApiErrorBody {
  message?: string
  error?: string
  status?: number
  detail?: string
  timestamp?: string
}

/** A normalized error thrown by every request in this client. */
export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | null

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  /** True for validation failures returned as 400. */
  get isValidationError(): boolean {
    return this.status === 400
  }

  get isConflict(): boolean {
    return this.status === 409
  }
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
    if (stored?.token) headers['Authorization'] = `Bearer ${stored.token}`
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
    throw new ApiError(0, 'Unable to reach the server. Is the backend running?', null)
  }

  if (response.status === 204) return undefined as T

  const rawText = await response.text()
  let parsed: unknown = null
  if (rawText.length > 0) {
    try {
      parsed = JSON.parse(rawText) as unknown
    } catch {
      parsed = null
    }
  }

  // Backend wraps every response in { status, message, data }. Unwrap it so the
  // client talks in terms of the contained DTO (or primitive, e.g. the JWT).
  if (parsed && typeof parsed === 'object' && 'data' in parsed && Object.keys(parsed as object).includes('status')) {
    parsed = (parsed as { data: unknown }).data
  }

  if (!response.ok) {
    // An expired/invalid token should log the user out immediately.
    if (response.status === 401) clearStoredAuth()

    const errorBody = (parsed ?? null) as ApiErrorBody | null
    const message =
      errorBody?.message ??
      errorBody?.detail ??
      errorBody?.error ??
      `Request failed with status ${response.status}`

    throw new ApiError(response.status, message, errorBody)
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
