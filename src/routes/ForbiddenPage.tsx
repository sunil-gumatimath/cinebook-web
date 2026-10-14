import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ForbiddenPage() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Access denied</CardTitle>
        <CardDescription>Your account does not have permission to view this page.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Theater-owner tools require a <code className="font-mono">THEATER_OWNER</code> role and
        admin tools require <code className="font-mono">ADMIN</code>.
      </CardContent>
    </Card>
  )
}
