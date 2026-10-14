import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PlaceholderPageProps {
  title: string
  hint?: string
}

/** Temporary stub so the router compiles while feature pages are built out. */
export function PlaceholderPage({ title, hint }: PlaceholderPageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {hint && <CardDescription>Backed by: {hint}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This page is a scaffold. Replace it with the real feature screen.
        </p>
      </CardContent>
    </Card>
  )
}
