import type { Item, SafeUser } from '@/db/schema'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Users,
} from 'lucide-react'
import { AnimatedDigitGroup } from '@/components/ui/transitions'

interface AnalyticsViewProps {
  items: Item[]
  users: SafeUser[]
}

export function AnalyticsView({ items, users }: AnalyticsViewProps) {
  const totalItems = items.length
  const completedItems = items.filter((i) => i.status === 'completed').length
  const inProgressItems = items.filter((i) => i.status === 'in_progress').length
  const inReviewItems = items.filter((i) => i.status === 'in_review').length

  const totalBudget = items.reduce((acc, item) => acc + (item.budget || 0), 0)
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  // Category breakdown
  const categoryStats = [
    { name: 'Engineering', count: items.filter((i) => i.category === 'engineering').length, color: 'bg-cyan-500' },
    { name: 'Design', count: items.filter((i) => i.category === 'design').length, color: 'bg-purple-500' },
    { name: 'Marketing', count: items.filter((i) => i.category === 'marketing').length, color: 'bg-pink-500' },
    { name: 'Operations', count: items.filter((i) => i.category === 'operations').length, color: 'bg-emerald-500' },
    { name: 'Finance', count: items.filter((i) => i.category === 'finance').length, color: 'bg-amber-500' },
  ]

  // Priority breakdown
  const priorityStats = [
    { name: 'Urgent', count: items.filter((i) => i.priority === 'urgent').length, color: 'bg-rose-500' },
    { name: 'High', count: items.filter((i) => i.priority === 'high').length, color: 'bg-orange-500' },
    { name: 'Medium', count: items.filter((i) => i.priority === 'medium').length, color: 'bg-amber-500' },
    { name: 'Low', count: items.filter((i) => i.priority === 'low').length, color: 'bg-teal-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          Portfolio & Team Analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time metrics, throughput velocity, budget distribution, and resource allocation.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Budget
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedDigitGroup value={`$${totalBudget.toLocaleString()}`} />
            </span>
            <span className="text-xs text-muted-foreground">allocated</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md transition-all hover:border-emerald-500/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg. Completion
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedDigitGroup value={`${completionRate}%`} />
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              {completedItems} of {totalItems} initiatives
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md transition-all hover:border-blue-500/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Sprints
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedDigitGroup value={inProgressItems + inReviewItems} />
            </span>
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">in flight</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md transition-all hover:border-violet-500/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Team Capacity
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedDigitGroup value={users.length} />
            </span>
            <span className="text-xs text-violet-700 dark:text-violet-300 font-medium">collaborators</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="rounded-2xl border border-border/70 bg-card/85 p-5 shadow-xs backdrop-blur-md space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Category Workload Distribution</h3>
            <p className="text-xs text-muted-foreground">Breakdown of initiatives by functional track</p>
          </div>

          <div className="space-y-3">
            {categoryStats.map((cat) => {
              const percentage = totalItems > 0 ? Math.round((cat.count / totalItems) * 100) : 0
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{cat.name}</span>
                    <span className="text-muted-foreground">{cat.count} items ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                    <div className={`h-full ${cat.color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Priority Matrix */}
        <div className="rounded-2xl border border-border/70 bg-card/85 p-5 shadow-xs backdrop-blur-md space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Priority Matrix</h3>
            <p className="text-xs text-muted-foreground">Urgency load across active pipeline</p>
          </div>

          <div className="space-y-3">
            {priorityStats.map((pri) => {
              const percentage = totalItems > 0 ? Math.round((pri.count / totalItems) * 100) : 0
              return (
                <div key={pri.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{pri.name}</span>
                    <span className="text-muted-foreground">{pri.count} items ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                    <div className={`h-full ${pri.color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
