import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
} from '@/components/ui/menu'
import type { Item, ItemCategory, ItemPriority, ItemStatus } from '@/db/schema'
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from './types'
import { safeJsonParseArray } from '@/lib/utils'
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'

interface ItemKanbanViewProps {
  items: Item[]
  onViewDetails: (item: Item) => void
  onEdit: (item: Item) => void
  onDuplicate: (id: string) => void
  onDelete: (item: Item) => void
  onStatusChange: (id: string, status: ItemStatus) => void
  onOpenCreateModalWithStatus: (status: ItemStatus) => void
}

const KANBAN_COLUMNS: { status: ItemStatus; label: string; dotColor: string }[] = [
  { status: 'backlog', label: 'Backlog', dotColor: 'bg-slate-400' },
  { status: 'in_progress', label: 'In Progress', dotColor: 'bg-blue-500' },
  { status: 'in_review', label: 'In Review', dotColor: 'bg-amber-500' },
  { status: 'completed', label: 'Completed', dotColor: 'bg-emerald-500' },
]

export function ItemKanbanView({
  items,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
  onOpenCreateModalWithStatus,
}: ItemKanbanViewProps) {
  const getPreviousStatus = (current: ItemStatus): ItemStatus | null => {
    if (current === 'in_progress') return 'backlog'
    if (current === 'in_review') return 'in_progress'
    if (current === 'completed') return 'in_review'
    return null
  }

  const getNextStatus = (current: ItemStatus): ItemStatus | null => {
    if (current === 'backlog') return 'in_progress'
    if (current === 'in_progress') return 'in_review'
    if (current === 'in_review') return 'completed'
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {KANBAN_COLUMNS.map((col) => {
        const colItems = items.filter((i) => i.status === col.status)
        const colBudget = colItems.reduce((acc, curr) => acc + (curr.budget || 0), 0)

        return (
          <div
            key={col.status}
            className="flex flex-col rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md overflow-hidden min-h-[450px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-border/50 bg-muted/40">
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${col.dotColor}`} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {col.label}
                </h3>
                <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                  {colItems.length}
                </span>
              </div>

              <span className="text-[11px] font-medium text-muted-foreground">
                ${colBudget.toLocaleString()}
              </span>
            </div>

            {/* Column Card List */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[70vh]">
              {colItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/60 border border-dashed border-border/60 rounded-xl">
                  <p className="text-xs">No items in {col.label.toLowerCase()}</p>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onOpenCreateModalWithStatus(col.status)}
                    className="mt-2 text-xs gap-1"
                  >
                    <Plus className="size-3" /> Add Item
                  </Button>
                </div>
              ) : (
                colItems.map((item) => {
                  const priorityCfg = PRIORITY_CONFIG[(item.priority as ItemPriority) || 'medium'] || PRIORITY_CONFIG.medium
                  const categoryCfg = CATEGORY_CONFIG[(item.category as ItemCategory) || 'engineering'] || CATEGORY_CONFIG.engineering
                  const prevStatus = getPreviousStatus(item.status as ItemStatus)
                  const nextStatus = getNextStatus(item.status as ItemStatus)

                  const tags = safeJsonParseArray<string>(item.tags, [])

                  return (
                    <div
                      key={item.id}
                      className="group/card relative flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                    >
                      {/* Card Top Metadata */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${categoryCfg.bg} ${categoryCfg.color} ${categoryCfg.border}`}
                          >
                            {categoryCfg.label}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${priorityCfg.bg} ${priorityCfg.color} ${priorityCfg.border}`}
                          >
                            {priorityCfg.label}
                          </span>
                        </div>

                        <Menu>
                          <MenuTrigger
                            render={
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                className="size-6 text-muted-foreground opacity-60 group-hover/card:opacity-100"
                              />
                            }
                          >
                            <MoreHorizontal className="size-3.5" />
                          </MenuTrigger>
                          <MenuPopup align="end" className="w-40">
                            <MenuItem onClick={() => onViewDetails(item)} className="gap-2 text-xs">
                              <Eye className="size-3.5" /> Details
                            </MenuItem>
                            <MenuItem onClick={() => onEdit(item)} className="gap-2 text-xs">
                              <Edit className="size-3.5" /> Edit
                            </MenuItem>
                            <MenuItem onClick={() => onDuplicate(item.id)} className="gap-2 text-xs">
                              <Copy className="size-3.5" /> Duplicate
                            </MenuItem>
                            <MenuSeparator />
                            <MenuItem
                              onClick={() => onDelete(item)}
                              className="gap-2 text-xs text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="size-3.5" /> Delete
                            </MenuItem>
                          </MenuPopup>
                        </Menu>
                      </div>

                      {/* Card Title & Description */}
                      <div>
                        <h4
                          onClick={() => onViewDetails(item)}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-2"
                        >
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 2).map((t, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium bg-muted text-muted-foreground"
                            >
                              #{t}
                            </span>
                          ))}
                          {tags.length > 2 && (
                            <span className="text-[9px] text-muted-foreground">
                              +{tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-1.5 w-full bg-muted" />
                      </div>

                      {/* Footer: Assignee, Due Date & Quick Advance */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="size-5 border border-border">
                            <AvatarImage src={item.assigneeAvatar || undefined} alt={item.assigneeName || ''} />
                            <AvatarFallback className="text-[9px]">
                              {item.assigneeName ? item.assigneeName[0] : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[70px]">
                            {item.assigneeName || 'Unassigned'}
                          </span>
                        </div>

                        {/* Quick stage transition buttons */}
                        <div className="flex items-center gap-1">
                          {prevStatus && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => onStatusChange(item.id, prevStatus)}
                              className="size-6 text-muted-foreground hover:text-foreground"
                              title={`Move to ${prevStatus}`}
                            >
                              <ArrowLeft className="size-3" />
                            </Button>
                          )}
                          {nextStatus && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => onStatusChange(item.id, nextStatus)}
                              className="size-6 text-muted-foreground hover:text-foreground"
                              title={`Move to ${nextStatus}`}
                            >
                              <ArrowRight className="size-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Quick Add Button */}
            <div className="p-2 border-t border-border/50 bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenCreateModalWithStatus(col.status)}
                className="w-full justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8"
              >
                <Plus className="size-3.5" />
                <span>Add to {col.label}</span>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
