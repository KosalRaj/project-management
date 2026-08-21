import { Link, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Compass, Home, LogIn, AlertTriangle, RotateCcw } from 'lucide-react'

export function NotFoundComponent() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/80 p-8 shadow-2xl backdrop-blur-2xl space-y-5">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="size-7 animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">404 Error</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Page Not Found</h1>
          <p className="text-xs text-muted-foreground">
            The page or workspace view you requested cannot be found or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Link to="/">
            <Button size="sm" className="gap-2 w-full sm:w-auto">
              <Home className="size-4" />
              Workspace Home
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
              <LogIn className="size-4" />
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export function RootErrorComponent({ error }: { error: Error }) {
  const router = useRouter()
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
      <div className="w-full max-w-md rounded-3xl border border-destructive/30 bg-card/80 p-8 shadow-2xl backdrop-blur-2xl space-y-5">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-destructive">Application Error</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Something Went Wrong</h1>
          <p className="text-xs text-muted-foreground break-words">
            {error?.message || 'An unexpected application runtime error occurred.'}
          </p>
        </div>
        <div className="pt-2">
          <Button size="sm" onClick={() => router.invalidate()} className="gap-2">
            <RotateCcw className="size-4" />
            Retry & Reload
          </Button>
        </div>
      </div>
    </div>
  )
}
