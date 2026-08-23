import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { Item, ItemCategory, ItemPriority, ItemStatus } from '@/db/schema'
import { CATEGORY_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG } from './types'
import { safeJsonParseArray } from '@/lib/utils'
import {
  Calendar,
  Clock,
  Tag,
  Copy,
  Edit,
  Trash2,
  CheckCircle2,
} from 'lucide-react'

interface ItemDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item | null
  onEdit: (item: Item) => void
  onDuplicate: (id: string) => void
  onDelete: (item: Item) => void
  onStatusChange: (id: string, status: ItemStatus) => void
  onProgressChange: (id: string, progress: number) => void
}

export function ItemDetailDrawer({
  open,
  onOpenChange,
  item,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
  onProgressChange,
}: ItemDetailDrawerProps) {
  if (!item) return null

  const statusCfg = STATUS_CONFIG[(item.status as ItemStatus) || 'backlog'] || STATUS_CONFIG.backlog
  const priorityCfg = PRIORITY_CONFIG[(item.priority as ItemPriority) || 'medium'] || PRIORITY_CONFIG.medium
  const categoryCfg = CATEGORY_CONFIG[(item.category as ItemCategory) || 'engineering'] || CATEGORY_CONFIG.engineering

  const tags = safeJsonParseArray<string>(item.tags, [])

  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'completed'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryCfg.bg} ${categoryCfg.color} ${categoryCfg.border}`}
            >
              {categoryCfg.label}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityCfg.bg} ${priorityCfg.color} ${priorityCfg.border}`}
            >
              {priorityCfg.label} Priority
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
            >
              {statusCfg.label}
            </span>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {item.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            ID: <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">{item.id}</code>
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="space-y-6 py-2">
          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Overview & Objectives
            </h4>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {item.description || 'No extended description provided for this initiative.'}
            </div>
          </div>

          {/* Key Metrics & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Completion Progress
                </span>
                <span className="text-sm font-bold text-foreground">{item.progress}%</span>
              </div>
              <Progress value={item.progress} className="h-2 w-full" />
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Adjust:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={item.progress}
                  onChange={(e) => onProgressChange(item.id, Number(e.target.value))}
                  className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Financials & Resource
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  ${(item.budget || 0).toLocaleString()}
                </span>
                <Badge variant="outline" className="text-xs">
                  Allocated
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Estimate includes compute, bandwidth, and engineering capacity.
              </p>
            </div>
          </div>

          {/* Assignee & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-card/60 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-3">
                Lead Owner
              </span>
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border border-border">
                  <AvatarImage src={item.assigneeAvatar || undefined} alt={item.assigneeName || 'User'} />
                  <AvatarFallback>{item.assigneeName ? item.assigneeName[0] : 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold text-foreground">{item.assigneeName || 'Unassigned'}</div>
                  <div className="text-xs text-muted-foreground">Project Owner</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Timeline & Deadlines
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> Due Date
                </span>
                <span className={`font-semibold ${isOverdue ? 'text-rose-500' : 'text-foreground'}`}>
                  {item.dueDate || 'No due date'} {isOverdue && '(Overdue)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Created
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Last Updated
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2 flex items-center gap-1.5">
                <Tag className="size-3.5" /> Tags & Metadata
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Status Movement */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Move Stage
            </span>
            <div className="flex flex-wrap gap-2">
              {(['backlog', 'in_progress', 'in_review', 'completed'] as ItemStatus[]).map((st) => {
                const isCurrent = item.status === st
                return (
                  <Button
                    key={st}
                    size="xs"
                    variant={isCurrent ? 'default' : 'outline'}
                    onClick={() => onStatusChange(item.id, st)}
                    className="text-xs h-7 capitalize"
                  >
                    {isCurrent && <CheckCircle2 className="size-3 mr-1 text-emerald-400" />}
                    {STATUS_CONFIG[st]?.label || st}
                  </Button>
                )
              })}
            </div>
          </div>
        </DialogPanel>

        <DialogFooter className="mt-4 flex-wrap gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDuplicate(item.id)
                onOpenChange(false)
              }}
              className="gap-1.5 text-xs"
            >
              <Copy className="size-3.5" />
              Duplicate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(item)
                onOpenChange(false)
              }}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Close
            </DialogClose>
            <Button
              size="sm"
              onClick={() => {
                onEdit(item)
                onOpenChange(false)
              }}
              className="gap-1.5"
            >
              <Edit className="size-3.5" />
              Edit Initiative
            </Button>
          </div>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
