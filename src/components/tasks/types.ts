import type { TaskStatus, TaskPriority, TaskType, ProjectHealth } from '@/db/schema'
import {
  CircleDashed,
  Circle,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUp,
  Minus,
  ArrowDown,
  Sparkles,
  Bug,
  CheckSquare,
  TrendingUp,
  Folder,
  Cpu,
  Palette,
  Cloud,
  Smartphone,
  Shield,
  Layers,
  Database,
} from 'lucide-react'

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string; border: string; icon: any }
> = {
  backlog: {
    label: 'Backlog',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    icon: CircleDashed,
  },
  todo: {
    label: 'To Do',
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/25',
    icon: Circle,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/25',
    icon: Clock,
  },
  in_review: {
    label: 'In Review',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/25',
    icon: Eye,
  },
  done: {
    label: 'Done',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/25',
    icon: CheckCircle2,
  },
  canceled: {
    label: 'Canceled',
    color: 'text-neutral-500 dark:text-neutral-400',
    bg: 'bg-neutral-500/10',
    border: 'border-neutral-500/20',
    icon: XCircle,
  },
}

export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string; border: string; icon: any; weight: number }
> = {
  urgent: {
    label: 'Urgent',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    icon: AlertCircle,
    weight: 4,
  },
  high: {
    label: 'High',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: ArrowUp,
    weight: 3,
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: Minus,
    weight: 2,
  },
  low: {
    label: 'Low',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    icon: ArrowDown,
    weight: 1,
  },
  none: {
    label: 'None',
    color: 'text-slate-400 dark:text-slate-500',
    bg: 'bg-slate-500/5',
    border: 'border-slate-500/10',
    icon: Minus,
    weight: 0,
  },
}

export const TASK_TYPE_CONFIG: Record<
  TaskType,
  { label: string; color: string; icon: any }
> = {
  feature: {
    label: 'Feature',
    color: 'text-sky-600 dark:text-sky-400',
    icon: Sparkles,
  },
  bug: {
    label: 'Bug',
    color: 'text-rose-600 dark:text-rose-400',
    icon: Bug,
  },
  task: {
    label: 'Task',
    color: 'text-blue-600 dark:text-blue-400',
    icon: CheckSquare,
  },
  improvement: {
    label: 'Improvement',
    color: 'text-violet-600 dark:text-violet-400',
    icon: TrendingUp,
  },
}

export const PROJECT_HEALTH_CONFIG: Record<
  ProjectHealth,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  on_track: {
    label: 'On Track',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  at_risk: {
    label: 'At Risk',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
  },
  off_track: {
    label: 'Off Track',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    dot: 'bg-rose-500',
  },
}

export const PROJECT_COLOR_MAP: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  sky: { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/30', ring: 'ring-sky-500/30' },
  indigo: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30', ring: 'ring-indigo-500/30' },
  violet: { bg: 'bg-violet-500/10 dark:bg-violet-500/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/30', ring: 'ring-violet-500/30' },
  emerald: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', ring: 'ring-emerald-500/30' },
  amber: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', ring: 'ring-amber-500/30' },
  rose: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', ring: 'ring-rose-500/30' },
}

export const PROJECT_ICONS: Record<string, any> = {
  Folder,
  Cpu,
  Palette,
  Cloud,
  Smartphone,
  Shield,
  Layers,
  Database,
}
