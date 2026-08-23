import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Plus, Sparkles, RefreshCw } from 'lucide-react'

interface DashboardHeaderProps {
  itemCount: number
  isSeeding: boolean
  isRefreshing: boolean
  onSeedData: () => void
  onRefresh: () => void
  onOpenCreateModal: () => void
}

export function DashboardHeader({
  itemCount,
  isSeeding,
  isRefreshing,
  onSeedData,
  onRefresh,
  onOpenCreateModal,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Operations & Projects Hub
          </h1>
          <Badge variant="outline" className="h-6 gap-1 bg-muted/50 font-medium">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage tasks, track delivery milestones, analyze resource allocation, and perform bulk operations.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-9 gap-1.5"
          title="Refresh Data"
        >
          {isRefreshing ? <Spinner className="size-3.5" /> : <RefreshCw className="size-3.5" />}
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        {itemCount === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSeedData}
            disabled={isSeeding}
            className="h-9 gap-1.5 border-teal-500/30 bg-teal-500/5 text-teal-600 hover:bg-teal-500/10 dark:text-teal-400"
          >
            {isSeeding ? <Spinner className="size-3.5" /> : <Sparkles className="size-3.5" />}
            <span>Load Demo Data</span>
          </Button>
        )}

        {itemCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSeedData}
            disabled={isSeeding}
            className="h-9 gap-1.5 border-dashed text-xs text-muted-foreground hover:text-foreground"
            title="Seed additional sample records"
          >
            {isSeeding ? <Spinner className="size-3.5" /> : <Sparkles className="size-3.5" />}
            <span className="hidden md:inline">Add Demo Tasks</span>
          </Button>
        )}

        <Button
          onClick={onOpenCreateModal}
          size="sm"
          className="h-9 gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          <span>New Initiative</span>
        </Button>
      </div>
    </div>
  )
}
