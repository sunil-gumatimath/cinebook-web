export type NavigateFn = (
  to: string,
  options?: { replace?: boolean; state?: unknown },
) => void | Promise<void>

let navigator: NavigateFn | null = null

export function setNavigator(fn: NavigateFn | null): void {
  navigator = fn
}

export function navigateTo(
  to: string,
  options?: { replace?: boolean; state?: unknown },
): void {
  if (navigator) {
    void navigator(to, options)
  } else if (typeof window !== 'undefined') {
    window.location.assign(to)
  }
}
