import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>404</CardTitle>
        <CardDescription>We could not find that page.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Double-check the URL, or head back to the home page.
      </CardContent>
    </Card>
  )
}
