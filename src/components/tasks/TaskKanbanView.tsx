import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
} from '@/components/ui/menu'
import type { Task, TaskStatus, TaskPriority, TaskType, SubtaskItem } from '@/db/schema'
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TASK_TYPE_CONFIG,
} from './types'
import { safeJsonParseArray } from '@/lib/utils'
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Zap,
  ListTodo,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
} from 'lucide-react'

interface TaskKanbanViewProps {
  tasks: Task[]
  onViewDetails: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onOpenCreateModalWithStatus: (status: TaskStatus) => void
}

const STAGES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done']

export function TaskKanbanView({
  tasks,
  onViewDetails,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenCreateModalWithStatus,
}: TaskKanbanViewProps) {
  const getPrevStage = (current: TaskStatus): TaskStatus | null => {
    const idx = STAGES.indexOf(current)
    return idx > 0 ? STAGES[idx - 1] : null
  }

  const getNextStage = (current: TaskStatus): TaskStatus | null => {
    const idx = STAGES.indexOf(current)
    return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
      {STAGES.map((status) => {
        const stageCfg = TASK_STATUS_CONFIG[status]
        const StageIcon = stageCfg.icon
        const colTasks = tasks.filter((t) => t.status === status)
        const totalPoints = colTasks.reduce((acc, t) => acc + (t.estimatePoints || 0), 0)

        return (
          <div
            key={status}
            className="flex flex-col rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md overflow-hidden min-h-[480px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/60 bg-muted/40">
              <div className="flex items-center gap-2 min-w-0">
                <StageIcon className={`size-4 shrink-0 ${stageCfg.color}`} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                  {stageCfg.label}
                </h3>
                <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>

              {totalPoints > 0 && (
                <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-0.5">
                  <Zap className="size-3 text-amber-500" /> {totalPoints} pts
                </span>
              )}
            </div>

            {/* Tasks Container */}
            <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[72vh]">
              {colTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/60 border border-dashed border-border/60 rounded-xl">
                  <p className="text-xs">No {stageCfg.label.toLowerCase()} tasks</p>
                  <Button
                    variant="ghost"
                    size="xs"
                    type="button"
                    onClick={() => onOpenCreateModalWithStatus(status)}
                    className="mt-2 text-xs gap-1"
                  >
                    <Plus className="size-3" /> Add Task
                  </Button>
                </div>
              ) : (
                colTasks.map((t) => {
                  const priorityCfg = TASK_PRIORITY_CONFIG[t.priority as TaskPriority] || TASK_PRIORITY_CONFIG.medium
                  const typeCfg = TASK_TYPE_CONFIG[t.type as TaskType] || TASK_TYPE_CONFIG.feature
                  const TypeIcon = typeCfg.icon
                  const PriorityIcon = priorityCfg.icon
                  const prevStage = getPrevStage(t.status as TaskStatus)
                  const nextStage = getNextStage(t.status as TaskStatus)

                  const subtasks = safeJsonParseArray<SubtaskItem>(t.subtasks, [])
                  const completedSubtasks = subtasks.filter((s) => s?.completed).length
                  const comments = safeJsonParseArray(t.comments, [])
                  const commentsCount = comments.length
                  const labels = safeJsonParseArray<string>(t.labels, [])

                  return (
                    <div
                      key={t.id}
                      className="group/card relative flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                    >
                      {/* Top Bar: Key & Type & Menu */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-primary border border-border/60 shrink-0">
                            {t.taskKey}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${typeCfg.color} truncate`}>
                            <TypeIcon className="size-3" />
                            {typeCfg.label}
                          </span>
                        </div>

                        <Menu>
                          <MenuTrigger
                            render={
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                className="size-6 text-muted-foreground opacity-40 group-hover/card:opacity-100"
                              />
                            }
                          >
                            <MoreHorizontal className="size-3.5" />
                          </MenuTrigger>
                          <MenuPopup align="end" className="w-36">
                            <MenuItem onClick={() => onViewDetails(t)} className="gap-2 text-xs">
                              <Eye className="size-3.5" /> View Details
                            </MenuItem>
                            <MenuItem onClick={() => onEdit(t)} className="gap-2 text-xs">
                              <Edit className="size-3.5" /> Edit
                            </MenuItem>
                            <MenuSeparator />
                            <MenuItem
                              onClick={() => onDelete(t)}
                              className="gap-2 text-xs text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="size-3.5" /> Delete
                            </MenuItem>
                          </MenuPopup>
                        </Menu>
                      </div>

                      {/* Title */}
                      <h4
                        onClick={() => onViewDetails(t)}
                        className="text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-2"
                      >
                        {t.title}
                      </h4>

                      {/* Labels */}
                      {labels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {labels.slice(0, 2).map((lbl) => (
                            <span
                              key={lbl}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-medium"
                            >
                              #{lbl}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Subtasks & Comments indicator */}
                      {(subtasks.length > 0 || commentsCount > 0) && (
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          {subtasks.length > 0 && (
                            <span className="flex items-center gap-1">
                              <ListTodo className="size-3" />
                              {completedSubtasks}/{subtasks.length}
                            </span>
                          )}
                          {commentsCount > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="size-3" />
                              {commentsCount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bottom Footer: Priority & Points & Assignee & Quick Move */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            title={`Priority: ${priorityCfg.label}`}
                            className={`inline-flex items-center p-1 rounded ${priorityCfg.bg} ${priorityCfg.color}`}
                          >
                            <PriorityIcon className="size-3" />
                          </span>

                          {t.estimatePoints && (
                            <span className="font-mono text-[10px] font-bold px-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              {t.estimatePoints}p
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Quick Stage shift buttons */}
                          <div className="opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-0.5">
                            {prevStage && (
                              <button
                                type="button"
                                title={`Move to ${TASK_STATUS_CONFIG[prevStage].label}`}
                                onClick={() => onStatusChange(t.id, prevStage)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <ArrowLeft className="size-3" />
                              </button>
                            )}
                            {nextStage && (
                              <button
                                type="button"
                                title={`Move to ${TASK_STATUS_CONFIG[nextStage].label}`}
                                onClick={() => onStatusChange(t.id, nextStage)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <ArrowRight className="size-3" />
                              </button>
                            )}
                          </div>

                          <Avatar className="size-5 border border-border shrink-0">
                            <AvatarImage src={t.assigneeAvatar || undefined} />
                            <AvatarFallback className="text-[9px]">
                              {t.assigneeName ? t.assigneeName[0] : 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Quick Add Footer Button */}
            <div className="p-2 border-t border-border/50 bg-card/40">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onOpenCreateModalWithStatus(status)}
                className="w-full justify-start text-[11px] text-muted-foreground hover:text-foreground gap-1.5 h-7"
              >
                <Plus className="size-3" /> Add Task
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
