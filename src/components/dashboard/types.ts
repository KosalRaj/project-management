import type { ItemCategory, ItemPriority, ItemStatus } from '@/db/schema'

export interface FilterState {
  search: string
  status: string
  priority: string
  category: string
  sortBy: 'created_desc' | 'created_asc' | 'due_date_asc' | 'priority_desc' | 'progress_desc' | 'budget_desc'
  page: number
  pageSize: number
}

export type ViewMode = 'table' | 'kanban'

export const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string; bg: string; border: string }> = {
  backlog: {
    label: 'Backlog',
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  in_review: {
    label: 'In Review',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  archived: {
    label: 'Archived',
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
}

export const PRIORITY_CONFIG: Record<ItemPriority, { label: string; color: string; bg: string; border: string; weight: number }> = {
  urgent: {
    label: 'Urgent',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    weight: 4,
  },
  high: {
    label: 'High',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    weight: 3,
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    weight: 2,
  },
  low: {
    label: 'Low',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    weight: 1,
  },
}

export const CATEGORY_CONFIG: Record<ItemCategory, { label: string; color: string; bg: string; border: string }> = {
  engineering: {
    label: 'Engineering',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  design: {
    label: 'Design',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  marketing: {
    label: 'Marketing',
    color: 'text-pink-700 dark:text-pink-300',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  operations: {
    label: 'Operations',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  finance: {
    label: 'Finance',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
}

export const AVATAR_PRESETS = [
  { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Aisha Patel', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Liam Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Sophia Zhang', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
]
