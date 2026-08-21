import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, RotateCcw } from 'lucide-react'
import type { UserFilterState } from './types'

interface UsersFiltersProps {
  filters: UserFilterState
  onFilterChange: (updates: Partial<UserFilterState>) => void
  onResetFilters: () => void
  totalCount: number
  filteredCount: number
}

const ROLE_OPTIONS = [
  { label: 'All Roles', value: 'all', dot: 'bg-muted-foreground/40' },
  { label: 'Administrator', value: 'admin', dot: 'bg-purple-500' },
  { label: 'Manager', value: 'manager', dot: 'bg-blue-500' },
  { label: 'Member', value: 'member', dot: 'bg-teal-500' },
  { label: 'Guest', value: 'guest', dot: 'bg-slate-500' },
]

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all', dot: 'bg-muted-foreground/40' },
  { label: 'Active', value: 'active', dot: 'bg-emerald-500' },
  { label: 'Inactive', value: 'inactive', dot: 'bg-amber-500' },
  { label: 'Suspended', value: 'suspended', dot: 'bg-rose-500' },
]

const SORT_OPTIONS = [
  { label: 'Name (A to Z)', value: 'name_asc' },
  { label: 'Name (Z to A)', value: 'name_desc' },
  { label: 'Newest First', value: 'created_desc' },
  { label: 'Oldest First', value: 'created_asc' },
]

export function UsersFilters({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
}: UsersFiltersProps) {
  const hasActiveFilters =
    filters.search.trim() !== '' || filters.role !== 'all' || filters.status !== 'all'

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 backdrop-blur-md">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search by name, email, department, or title..."
            className="h-9 pl-9 pr-8 text-sm bg-background/80"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              type="button"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role filter (p-select-14 style) */}
          <Select
            value={filters.role}
            onValueChange={(val) => onFilterChange({ role: (val as string) || 'all', page: 1 })}
          >
            <SelectTrigger aria-label="Filter by role" className="h-9 w-auto min-w-36 bg-background/80 text-xs font-medium">
              <SelectValue placeholder="Role">
                {(val) => {
                  const item = ROLE_OPTIONS.find((r) => r.value === val) || ROLE_OPTIONS[0]
                  return (
                    <span className="flex items-center gap-1.5 truncate">
                      <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </span>
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {ROLE_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          {/* Status filter */}
          <Select
            value={filters.status}
            onValueChange={(val) => onFilterChange({ status: (val as string) || 'all', page: 1 })}
          >
            <SelectTrigger aria-label="Filter by status" className="h-9 w-auto min-w-36 bg-background/80 text-xs font-medium">
              <SelectValue placeholder="Status">
                {(val) => {
                  const item = STATUS_OPTIONS.find((s) => s.value === val) || STATUS_OPTIONS[0]
                  return (
                    <span className="flex items-center gap-1.5 truncate">
                      <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </span>
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {STATUS_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          {/* Sort selector */}
          <Select
            value={filters.sortBy}
            onValueChange={(val) => onFilterChange({ sortBy: (val as any) || 'name_asc', page: 1 })}
          >
            <SelectTrigger aria-label="Sort users" className="h-9 w-auto min-w-40 bg-background/80 text-xs font-medium">
              <SelectValue placeholder="Sort">
                {(val) => {
                  const item = SORT_OPTIONS.find((s) => s.value === val) || SORT_OPTIONS[0]
                  return <span className="truncate">{item.label}</span>
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {SORT_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="text-xs">
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </div>

      {/* Filter status summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{filteredCount}</strong> of{' '}
            <strong className="text-foreground">{totalCount}</strong> users
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
              Filters Active
            </Badge>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onResetFilters}
            className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Reset filters
          </Button>
        )}
      </div>
    </div>
  )
}
