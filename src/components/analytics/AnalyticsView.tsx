import type { Item, Project, Task, SafeUser, TaskStatus, TaskType, ProjectHealth } from '@/db/schema'
import {
  BarChart3,
  DollarSign,
  CheckCircle2,
  Users,
  Folder,
  Layers,
  Zap,
  Sparkles,
} from 'lucide-react'
import { AnimatedDigitGroup } from '@/components/ui/transitions'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  TASK_STATUS_CONFIG,
  TASK_TYPE_CONFIG,
  PROJECT_HEALTH_CONFIG,
} from '@/components/tasks/types'

interface AnalyticsViewProps {
  items: Item[]
  projects: Project[]
  tasks: Task[]
  users: SafeUser[]
}

export function AnalyticsView({ items, projects = [], tasks = [], users = [] }: AnalyticsViewProps) {
  // Tasks calculations
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const inFlightTasks = tasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const totalPoints = tasks.reduce((acc, t) => acc + (t.estimatePoints || 0), 0)
  const completedPoints = tasks
    .filter((t) => t.status === 'done')
    .reduce((acc, t) => acc + (t.estimatePoints || 0), 0)

  // Budget calculations
  const totalProjectBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0)
  const totalItemBudget = items.reduce((acc, item) => acc + (item.budget || 0), 0)
  const combinedBudget = totalProjectBudget + totalItemBudget

  // Health distribution
  const onTrackProjects = projects.filter((p) => p.health === 'on_track')
  const atRiskProjects = projects.filter((p) => p.health === 'at_risk')
  const offTrackProjects = projects.filter((p) => p.health === 'off_track')

  // Task Stage Distribution
  const stageStats = (['backlog', 'todo', 'in_progress', 'in_review', 'done'] as TaskStatus[]).map((st) => {
    const count = tasks.filter((t) => t.status === st).length
    const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
    const cfg = TASK_STATUS_CONFIG[st] || TASK_STATUS_CONFIG.todo
    return { status: st, count, pct, cfg }
  })

  // Task Type Breakdown
  const typeStats = (['feature', 'bug', 'task', 'improvement'] as TaskType[]).map((tp) => {
    const count = tasks.filter((t) => t.type === tp).length
    const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
    const cfg = TASK_TYPE_CONFIG[tp] || TASK_TYPE_CONFIG.feature
    return { type: tp, count, pct, cfg }
  })

  // Team Workload
  const userWorkloads = users.map((u) => {
    const assignedTasks = tasks.filter((t) => t.assigneeId === u.id)
    const points = assignedTasks.reduce((acc, t) => acc + (t.estimatePoints || 0), 0)
    const completed = assignedTasks.filter((t) => t.status === 'done').length
    return {
      user: u,
      taskCount: assignedTasks.length,
      points,
      completed,
    }
  }).sort((a, b) => b.taskCount - a.taskCount)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          Executive Analytics & Velocity Hub
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time cross-project velocity, burndown points, delivery health, and team capacity tracking.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Combined Budget
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedDigitGroup value={`$${combinedBudget.toLocaleString()}`} />
            </span>
            <span className="text-xs text-muted-foreground">{projects.length} projects</span>
          </div>
        </div>

        {/* Task Velocity */}
        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md transition-all hover:border-emerald-500/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Task Velocity
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedDigitGroup value={`${taskCompletionRate}%`} />
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              {completedTasks}/{totalTasks} tasks done
            </span>
          </div>
        </div>

        {/* Story Points Delivered */}
        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md transition-all hover:border-amber-500/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Story Points
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedDigitGroup value={`${completedPoints}/${totalPoints}`} />
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">pts delivered</span>
          </div>
        </div>

        {/* Active Capacity */}
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
            <span className="text-xs text-violet-700 dark:text-violet-300 font-medium">
              {inFlightTasks} tasks in flight
            </span>
          </div>
        </div>
      </div>

      {/* Stage Distribution & Project Health Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Stage Distribution */}
        <div className="rounded-2xl border border-border/70 bg-card/85 p-5 shadow-xs backdrop-blur-md space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              Task Stage & Workflow Distribution
            </h3>
            <p className="text-xs text-muted-foreground">Live volume across all project pipelines</p>
          </div>

          <div className="space-y-3 pt-1">
            {stageStats.map((st) => {
              const Icon = st.cfg.icon
              return (
                <div key={st.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <Icon className={`size-3.5 ${st.cfg.color}`} />
                      {st.cfg.label}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {st.count} tasks ({st.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-[width] duration-500 ease-out rounded-full"
                      style={{ width: `${st.pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Project Health Status Overview */}
        <div className="rounded-2xl border border-border/70 bg-card/85 p-5 shadow-xs backdrop-blur-md space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Folder className="size-4 text-primary" />
              Project Portfolio Health Matrix
            </h3>
            <p className="text-xs text-muted-foreground">Status flags across active roadmaps</p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1 text-center">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">On Track</span>
              <p className="text-xl font-extrabold text-foreground">{onTrackProjects.length}</p>
              <span className="text-[10px] text-muted-foreground block">Healthy pace</span>
            </div>

            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1 text-center">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">At Risk</span>
              <p className="text-xl font-extrabold text-foreground">{atRiskProjects.length}</p>
              <span className="text-[10px] text-muted-foreground block">Review needed</span>
            </div>

            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1 text-center">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Off Track</span>
              <p className="text-xl font-extrabold text-foreground">{offTrackProjects.length}</p>
              <span className="text-[10px] text-muted-foreground block">Action required</span>
            </div>
          </div>

          {/* Project List mini breakdown */}
          <div className="space-y-2 pt-1 border-t border-border/40">
            {projects.slice(0, 3).map((p) => {
              const healthCfg = PROJECT_HEALTH_CONFIG[p.health as ProjectHealth] || PROJECT_HEALTH_CONFIG.on_track
              return (
                <div key={p.id} className="flex items-center justify-between text-xs py-1">
                  <span className="font-semibold text-foreground truncate max-w-[180px]">{p.name}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${healthCfg.bg} ${healthCfg.color} ${healthCfg.border}`}>
                    <span className={`size-1.5 rounded-full ${healthCfg.dot}`} />
                    {healthCfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Task Type Breakdown & Team Contributor Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Type Matrix */}
        <div className="rounded-2xl border border-border/70 bg-card/85 p-5 shadow-xs backdrop-blur-md space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Work Item Type Breakdown
            </h3>
            <p className="text-xs text-muted-foreground">Distribution by feature, bug, task & improvement</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {typeStats.map((tp) => {
              const Icon = tp.cfg.icon
              return (
                <div key={tp.type} className="p-3 rounded-xl border border-border/50 bg-muted/20 text-center space-y-1">
                  <div className="flex justify-center">
                    <Icon className={`size-4 ${tp.cfg.color}`} />
                  </div>
                  <span className="text-xs font-bold text-foreground block">{tp.count}</span>
                  <span className="text-[10px] text-muted-foreground font-medium capitalize">{tp.type}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Team Resource Allocation */}
        <div className="rounded-2xl border border-border/70 bg-card/85 p-5 shadow-xs backdrop-blur-md space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Team Workload & Capacity
            </h3>
            <p className="text-xs text-muted-foreground">Task count and estimated story points per member</p>
          </div>

          <div className="space-y-2 pt-1">
            {userWorkloads.slice(0, 4).map((uw) => (
              <div key={uw.user.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-muted/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="size-7 border border-border shrink-0">
                    <AvatarImage src={uw.user.avatar || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {uw.user.name ? uw.user.name[0] : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground block truncate">{uw.user.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{uw.user.title || uw.user.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {uw.taskCount} tasks
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    {uw.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
