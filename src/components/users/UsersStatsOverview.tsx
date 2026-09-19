import type { SafeUser } from '@/db/schema'
import { Users, UserCheck, Shield, Building2 } from 'lucide-react'
import { AnimatedDigitGroup } from '@/components/ui/transitions'

interface UsersStatsOverviewProps {
  users: SafeUser[]
}

export function UsersStatsOverview({ users }: UsersStatsOverviewProps) {
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.status === 'active').length
  const adminAndManagers = users.filter((u) => u.role === 'admin' || u.role === 'manager').length
  const uniqueDepartments = new Set(users.map((u) => u.department).filter(Boolean)).size

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users */}
      <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md transition-[border-color,box-shadow] duration-150 ease-out hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Members
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Users className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            <AnimatedDigitGroup value={totalUsers} />
          </span>
          <span className="text-xs text-muted-foreground">registered</span>
        </div>
      </div>

      {/* Active Members */}
      <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md transition-[border-color,box-shadow] duration-150 ease-out hover:border-emerald-500/30 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Now
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            <AnimatedDigitGroup value={activeUsers} />
          </span>
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% active
          </span>
        </div>
      </div>

      {/* Admins & Managers */}
      <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md transition-[border-color,box-shadow] duration-150 ease-out hover:border-violet-500/30 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Admins & Leads
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Shield className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            <AnimatedDigitGroup value={adminAndManagers} />
          </span>
          <span className="text-xs text-violet-700 dark:text-violet-300 font-medium">privileged</span>
        </div>
      </div>

      {/* Departments */}
      <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md transition-[border-color,box-shadow] duration-150 ease-out hover:border-blue-500/30 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Departments
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Building2 className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            <AnimatedDigitGroup value={uniqueDepartments} />
          </span>
          <span className="text-xs text-muted-foreground">active units</span>
        </div>
      </div>
    </div>
  )
}
