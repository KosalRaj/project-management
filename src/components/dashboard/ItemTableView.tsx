import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
  MenuGroup,
  MenuGroupLabel,
} from '@/components/ui/menu'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Item, ItemCategory, ItemPriority, ItemStatus } from '@/db/schema'
import { CATEGORY_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG } from './types'

const STATUS_OPTIONS: { label: string; value: ItemStatus; dot: string }[] = [
  { label: 'Backlog', value: 'backlog', dot: 'bg-slate-500' },
  { label: 'In Progress', value: 'in_progress', dot: 'bg-blue-500' },
  { label: 'In Review', value: 'in_review', dot: 'bg-amber-500' },
  { label: 'Completed', value: 'completed', dot: 'bg-emerald-500' },
]
import {
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react'

interface ItemTableViewProps {
  items: Item[]
  totalItems: number
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onViewDetails: (item: Item) => void
  onEdit: (item: Item) => void
  onDuplicate: (id: string) => void
  onDelete: (item: Item) => void
  onStatusChange: (id: string, status: ItemStatus) => void
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onOpenCreateModal: () => void
}

export function ItemTableView({
  items,
  totalItems,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onOpenCreateModal,
}: ItemTableViewProps) {
  const isAllSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id))
  const isSomeSelected = items.some((i) => selectedIds.includes(i.id)) && !isAllSelected
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/75 backdrop-blur-md overflow-hidden shadow-xs">
      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
              <th className="py-3.5 pl-4 pr-2 w-10">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Select all initiatives"
                />
              </th>
              <th className="py-3.5 px-3 min-w-[240px]">Initiative & Tags</th>
              <th className="py-3.5 px-3 min-w-[110px]">Status</th>
              <th className="py-3.5 px-3 min-w-[100px]">Priority</th>
              <th className="py-3.5 px-3 min-w-[110px]">Category</th>
              <th className="py-3.5 px-3 min-w-[130px]">Progress</th>
              <th className="py-3.5 px-3 min-w-[130px]">Assignee</th>
              <th className="py-3.5 px-3 min-w-[110px]">Due Date</th>
              <th className="py-3.5 px-3 min-w-[90px] text-right">Budget</th>
              <th className="py-3.5 pr-4 pl-2 text-right w-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                      <FolderOpen className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-foreground">No initiatives found</h4>
                      <p className="text-xs text-muted-foreground">
                        Try adjusting your search query, clearing filters, or create a new initiative.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={onOpenCreateModal}
                      className="mt-2 text-xs"
                    >
                      Create First Initiative
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                const statusCfg = STATUS_CONFIG[(item.status as ItemStatus) || 'backlog'] || STATUS_CONFIG.backlog
                const priorityCfg = PRIORITY_CONFIG[(item.priority as ItemPriority) || 'medium'] || PRIORITY_CONFIG.medium
                const categoryCfg = CATEGORY_CONFIG[(item.category as ItemCategory) || 'engineering'] || CATEGORY_CONFIG.engineering
                
                let tags: string[] = []
                try {
                  tags = JSON.parse(item.tags || '[]')
                } catch {
                  tags = []
                }

                const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'completed'

                return (
                  <tr
                    key={item.id}
                    className={`group transition-colors hover:bg-muted/30 ${
                      isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                    }`}
                  >
                    {/* Select Checkbox */}
                    <td className="py-3 pl-4 pr-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect(item.id)}
                        aria-label={`Select ${item.title}`}
                      />
                    </td>

                    {/* Title & Description & Tags */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span
                          onClick={() => onViewDetails(item)}
                          className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1 group-hover:underline"
                        >
                          {item.title}
                        </span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </span>
                        )}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground"
                              >
                                #{tag}
                              </span>
                            ))}
                            {tags.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status (compact p-select-14 style) */}
                    <td className="py-3 px-3">
                      <Select
                        value={item.status}
                        onValueChange={(val) => val && onStatusChange(item.id, val as ItemStatus)}
                      >
                        <SelectTrigger
                          aria-label={`Change status for ${item.title}`}
                          className={`h-7 w-fit min-w-28 px-2 text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
                        >
                          <SelectValue>
                            {(val) => {
                              const cfg = STATUS_CONFIG[val as ItemStatus] || statusCfg
                              const opt = STATUS_OPTIONS.find((o) => o.value === val) || STATUS_OPTIONS[0]
                              return (
                                <span className="flex items-center gap-1.5 truncate">
                                  <span className={`size-1.5 rounded-full ${opt.dot}`} aria-hidden="true" />
                                  <span className="truncate">{cfg.label}</span>
                                </span>
                              )
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectPopup>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              <span className="flex items-center gap-1.5">
                                <span className={`size-1.5 rounded-full ${opt.dot}`} aria-hidden="true" />
                                <span>{opt.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectPopup>
                      </Select>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${priorityCfg.bg} ${priorityCfg.color} ${priorityCfg.border}`}
                      >
                        {priorityCfg.label}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${categoryCfg.bg} ${categoryCfg.color} ${categoryCfg.border}`}
                      >
                        {categoryCfg.label}
                      </span>
                    </td>

                    {/* Progress */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Progress value={item.progress} className="h-1.5 w-16 bg-muted" />
                        <span className="text-xs font-medium text-muted-foreground w-8">
                          {item.progress}%
                        </span>
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6 border border-border">
                          <AvatarImage src={item.assigneeAvatar || undefined} alt={item.assigneeName || ''} />
                          <AvatarFallback className="text-[10px]">
                            {item.assigneeName ? item.assigneeName[0] : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-foreground font-medium truncate max-w-[90px]">
                          {item.assigneeName || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-3 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="size-3 text-muted-foreground/70" />
                        <span className={isOverdue ? 'text-rose-500 font-semibold' : ''}>
                          {item.dueDate ? item.dueDate : '—'}
                        </span>
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="py-3 px-3 text-xs text-right font-medium text-foreground">
                      ${(item.budget || 0).toLocaleString()}
                    </td>

                    {/* Row Actions Menu */}
                    <td className="py-3 pr-4 pl-2 text-right">
                      <Menu>
                        <MenuTrigger
                          render={<Button size="icon-xs" variant="ghost" className="size-7" />}
                        >
                          <MoreHorizontal className="size-4 text-muted-foreground" />
                        </MenuTrigger>
                        <MenuPopup align="end" className="w-44">
                          <MenuItem onClick={() => onViewDetails(item)} className="gap-2 text-xs">
                            <Eye className="size-3.5 text-muted-foreground" />
                            View Details
                          </MenuItem>
                          <MenuItem onClick={() => onEdit(item)} className="gap-2 text-xs">
                            <Edit className="size-3.5 text-muted-foreground" />
                            Edit Initiative
                          </MenuItem>
                          <MenuItem onClick={() => onDuplicate(item.id)} className="gap-2 text-xs">
                            <Copy className="size-3.5 text-muted-foreground" />
                            Duplicate
                          </MenuItem>
                          <MenuSeparator />
                          <MenuGroup>
                            <MenuGroupLabel className="text-[10px] font-semibold text-muted-foreground px-2 py-1">
                              Stage
                            </MenuGroupLabel>
                            <MenuItem onClick={() => onStatusChange(item.id, 'backlog')} className="text-xs">
                              Move to Backlog
                            </MenuItem>
                            <MenuItem onClick={() => onStatusChange(item.id, 'in_progress')} className="text-xs">
                              Move to In Progress
                            </MenuItem>
                            <MenuItem onClick={() => onStatusChange(item.id, 'in_review')} className="text-xs">
                              Move to In Review
                            </MenuItem>
                            <MenuItem onClick={() => onStatusChange(item.id, 'completed')} className="text-xs">
                              Mark Completed
                            </MenuItem>
                          </MenuGroup>
                          <MenuSeparator />
                          <MenuItem
                            onClick={() => onDelete(item)}
                            className="gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </MenuItem>
                        </MenuPopup>
                      </Menu>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Page size footer */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => val && onPageSizeChange(Number(val))}
            >
              <SelectTrigger aria-label="Rows per page" className="h-7 w-fit min-w-16 px-2 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Page <strong className="text-foreground">{page}</strong> of{' '}
              <strong className="text-foreground">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="size-7"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="size-7"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
