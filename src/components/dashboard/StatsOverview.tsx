import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AnimatedDigitGroup } from '@/components/ui/transitions'
import type { Item } from '@/db/schema'
import {
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'

interface StatsOverviewProps {
  items: Item[]
  onQuickFilterStatus?: (status: string) => void
}

export function StatsOverview({ items, onQuickFilterStatus }: StatsOverviewProps) {
  const total = items.length
  const completed = items.filter((i) => i.status === 'completed' || i.completed).length
  const inProgress = items.filter((i) => i.status === 'in_progress').length
  const inReview = items.filter((i) => i.status === 'in_review').length
  const urgentOrHigh = items.filter((i) => i.priority === 'urgent' || i.priority === 'high').length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const totalBudget = items.reduce((acc, curr) => acc + (curr.budget || 0), 0)

  const stats = [
    {
      title: 'Total Initiatives',
      value: total,
      subtext: `${inProgress + inReview} active in flight`,
      icon: Layers,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10 dark:bg-sky-500/15',
      trend: '+12% this month',
      onClick: () => onQuickFilterStatus?.('all'),
    },
    {
      title: 'Active Workload',
      value: inProgress,
      subtext: `${inReview} awaiting review`,
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      trend: '68% capacity',
      onClick: () => onQuickFilterStatus?.('in_progress'),
    },
    {
      title: 'Urgent & High Priority',
      value: urgentOrHigh,
      subtext: urgentOrHigh > 0 ? 'Requires attention' : 'All clear',
      icon: AlertTriangle,
      color: urgentOrHigh > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
      bg: urgentOrHigh > 0 ? 'bg-rose-500/10 dark:bg-rose-500/15' : 'bg-emerald-500/10 dark:bg-emerald-500/15',
      trend: urgentOrHigh > 2 ? 'Action needed' : 'On track',
      onClick: () => onQuickFilterStatus?.('urgent'),
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      subtext: `${completed} of ${total} resolved`,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      progress: completionRate,
      onClick: () => onQuickFilterStatus?.('completed'),
    },
    {
      title: 'Allocated Budget',
      value: `$${totalBudget.toLocaleString()}`,
      subtext: 'Across all operations',
      icon: DollarSign,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10 dark:bg-violet-500/15',
      trend: 'Estimated total',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <Card
            key={idx}
            onClick={stat.onClick}
            className={`group relative overflow-hidden border border-border/70 bg-card/85 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md ${
              stat.onClick ? 'cursor-pointer' : ''
            }`}
          >
            <CardContent className="px-4 sm:px-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </span>
                <div className={`flex size-8 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="size-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between flex-col">
                <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  <AnimatedDigitGroup value={stat.value} />
                </span>
                {stat.trend && (
                  <span className="inline-flex items-center text-[11px] font-medium text-muted-foreground">
                    <TrendingUp className="mr-1 size-3 text-emerald-500" />
                    {stat.trend}
                  </span>
                )}
              </div>

              {stat.progress !== undefined ? (
                <div className="mt-3 space-y-1">
                  <Progress value={stat.progress} className="h-1.5 w-full bg-muted" />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{stat.subtext}</span>
                    <span>{stat.progress}%</span>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
                  <span>{stat.subtext}</span>
                  {stat.onClick && (
                    <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100 text-primary" />
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
