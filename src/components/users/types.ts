import type { UserRole, UserStatus } from '@/db/schema'

export interface UserFilterState {
  search: string
  role: string
  status: string
  sortBy: 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc' | 'role_asc'
  page: number
  pageSize: number
}

export const USER_ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
  admin: {
    label: 'Administrator',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  manager: {
    label: 'Manager',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  member: {
    label: 'Member',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
  },
  guest: {
    label: 'Guest',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
}

export const USER_STATUS_CONFIG: Record<UserStatus, { label: string; dot: string; color: string; bg: string; border: string }> = {
  active: {
    label: 'Active',
    dot: 'bg-emerald-500',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  inactive: {
    label: 'Inactive',
    dot: 'bg-amber-500',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  suspended: {
    label: 'Suspended',
    dot: 'bg-rose-500',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
}

export const USER_AVATAR_PRESETS = [
  { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Aisha Patel', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Liam Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Sophia Zhang', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
  { name: 'Maya Lin', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
]
