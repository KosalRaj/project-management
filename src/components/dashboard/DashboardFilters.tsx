import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  X,
  List,
  LayoutGrid,
  RotateCcw,
} from 'lucide-react'
import type { FilterState, ViewMode } from './types'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_ITEMS = [
  { label: 'All Statuses', value: 'all', dot: 'bg-muted-foreground/40' },
  { label: 'Backlog', value: 'backlog', dot: 'bg-slate-500' },
  { label: 'In Progress', value: 'in_progress', dot: 'bg-blue-500' },
  { label: 'In Review', value: 'in_review', dot: 'bg-amber-500' },
  { label: 'Completed', value: 'completed', dot: 'bg-emerald-500' },
]

const PRIORITY_ITEMS = [
  { label: 'All Priorities', value: 'all', dot: 'bg-muted-foreground/40' },
  { label: 'Urgent', value: 'urgent', dot: 'bg-rose-500' },
  { label: 'High', value: 'high', dot: 'bg-orange-500' },
  { label: 'Medium', value: 'medium', dot: 'bg-amber-500' },
  { label: 'Low', value: 'low', dot: 'bg-teal-500' },
]

const CATEGORY_ITEMS = [
  { label: 'All Categories', value: 'all' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Design', value: 'design' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Operations', value: 'operations' },
  { label: 'Finance', value: 'finance' },
]

const SORT_ITEMS = [
  { label: 'Newest First', value: 'created_desc' },
  { label: 'Oldest First', value: 'created_asc' },
  { label: 'Due Date (Soonest)', value: 'due_date_asc' },
  { label: 'Priority (High to Low)', value: 'priority_desc' },
  { label: 'Progress (High to Low)', value: 'progress_desc' },
  { label: 'Budget (High to Low)', value: 'budget_desc' },
]

interface DashboardFiltersProps {
  filters: FilterState
  onFilterChange: (updates: Partial<FilterState>) => void
  onResetFilters: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  totalCount: number
  filteredCount: number
}

export function DashboardFilters({
  filters,
  onFilterChange,
  onResetFilters,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
}: DashboardFiltersProps) {
  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all'

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 backdrop-blur-md">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search by title, description, or tag..."
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

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter (p-select-14 style with status dots) */}
          <Select
            value={filters.status}
            onValueChange={(val) => onFilterChange({ status: (val as string) || 'all', page: 1 })}
          >
            <SelectTrigger aria-label="Filter by status" className="h-9 w-auto min-w-36 bg-background/80 text-xs font-medium">
              <SelectValue placeholder="Status">
                {(val) => {
                  const item = STATUS_ITEMS.find((i) => i.value === val) || STATUS_ITEMS[0]
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
              {STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          {/* Priority filter (with colored indicator dots) */}
          <Select
            value={filters.priority}
            onValueChange={(val) => onFilterChange({ priority: (val as string) || 'all', page: 1 })}
          >
            <SelectTrigger aria-label="Filter by priority" className="h-9 w-auto min-w-36 bg-background/80 text-xs font-medium">
              <SelectValue placeholder="Priority">
                {(val) => {
                  const item = PRIORITY_ITEMS.find((i) => i.value === val) || PRIORITY_ITEMS[0]
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
              {PRIORITY_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          {/* Category filter */}
          <Select
            value={filters.category}
            onValueChange={(val) => onFilterChange({ category: (val as string) || 'all', page: 1 })}
          >
            <SelectTrigger aria-label="Filter by category" className="h-9 w-auto min-w-36 bg-background/80 text-xs font-medium">
              <SelectValue placeholder="Category">
                {(val) => {
                  const item = CATEGORY_ITEMS.find((i) => i.value === val) || CATEGORY_ITEMS[0]
                  return <span className="truncate">{item.label}</span>
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {CATEGORY_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="text-xs">
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          {/* Sort selector */}
          <Select
            value={filters.sortBy}
            onValueChange={(val) => onFilterChange({ sortBy: (val as any) || 'created_desc', page: 1 })}
          >
            <SelectTrigger aria-label="Sort initiatives" className="h-9 w-auto min-w-44 bg-background/80 text-xs font-medium">
              <SelectValue placeholder="Sort By">
                {(val) => {
                  const item = SORT_ITEMS.find((i) => i.value === val) || SORT_ITEMS[0]
                  return <span className="truncate">{item.label}</span>
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {SORT_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="text-xs">
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-border/80 bg-muted/60 p-0.5">
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              type="button"
            >
              <List className="size-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              type="button"
            >
              <LayoutGrid className="size-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter status summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{filteredCount}</strong> of{' '}
            <strong className="text-foreground">{totalCount}</strong> items
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
            Reset all filters
          </Button>
        )}
      </div>
    </div>
  )
}
