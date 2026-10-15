export function PageSkeleton() {
  return (
    <div
      className="space-y-6 animate-pulse py-4"
      role="status"
      aria-busy="true"
      aria-label="Loading page content"
    >
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-md bg-muted/70" />
        <div className="h-4 w-72 rounded-md bg-muted/40" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4">
        <div className="h-44 rounded-xl bg-muted/40" />
        <div className="h-44 rounded-xl bg-muted/40" />
        <div className="h-44 rounded-xl bg-muted/40" />
      </div>
    </div>
  )
}
