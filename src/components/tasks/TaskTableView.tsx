import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
} from '@/components/ui/menu'
import type { Task, Project, TaskStatus, TaskPriority, TaskType, SubtaskItem } from '@/db/schema'
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TASK_TYPE_CONFIG,
} from './types'
import { safeJsonParseArray } from '@/lib/utils'
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  ListTodo,
  FolderOpen,
  Plus,
} from 'lucide-react'

interface TaskTableViewProps {
  tasks: Task[]
  projects: Project[]
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onViewDetails: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onOpenCreateModal: () => void
}

export function TaskTableView({
  tasks,
  projects,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewDetails,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenCreateModal,
}: TaskTableViewProps) {
  const isAllSelected = tasks.length > 0 && tasks.every((t) => selectedIds.includes(t.id))
  const isSomeSelected = tasks.some((t) => selectedIds.includes(t.id)) && !isAllSelected

  const projectMap = new Map(projects.map((p) => [p.id, p]))

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/85 backdrop-blur-md overflow-hidden shadow-xs">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[960px]">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
              <th className="py-3 pl-4 pr-2 w-10 whitespace-nowrap">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Select all tasks"
                />
              </th>
              <th className="py-3 px-2 w-24 whitespace-nowrap">Key</th>
              <th className="py-3 px-3 min-w-[260px] whitespace-nowrap">Task Title & Labels</th>
              <th className="py-3 px-3 min-w-[130px] whitespace-nowrap">Project</th>
              <th className="py-3 px-3 min-w-[130px] whitespace-nowrap">Status</th>
              <th className="py-3 px-3 min-w-[110px] whitespace-nowrap">Priority</th>
              <th className="py-3 px-3 min-w-[110px] whitespace-nowrap">Type</th>
              <th className="py-3 px-3 min-w-[70px] text-center whitespace-nowrap">Points</th>
              <th className="py-3 px-3 min-w-[140px] whitespace-nowrap">Assignee</th>
              <th className="py-3 px-3 min-w-[115px] whitespace-nowrap">Due Date</th>
              <th className="py-3 pr-4 pl-2 text-right w-16 min-w-[64px] whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                      <FolderOpen className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-foreground">No tasks found</h4>
                      <p className="text-xs text-muted-foreground">
                        Try adjusting your filters or create a new task to get started.
                      </p>
                    </div>
                    <Button size="sm" onClick={onOpenCreateModal} className="mt-2 text-xs gap-1.5 cursor-pointer">
                      <Plus className="size-3.5" /> Create Task
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((t) => {
                const isSelected = selectedIds.includes(t.id)
                const statusCfg = TASK_STATUS_CONFIG[t.status as TaskStatus] || TASK_STATUS_CONFIG.todo
                const priorityCfg = TASK_PRIORITY_CONFIG[t.priority as TaskPriority] || TASK_PRIORITY_CONFIG.medium
                const typeCfg = TASK_TYPE_CONFIG[t.type as TaskType] || TASK_TYPE_CONFIG.feature
                const project = projectMap.get(t.projectId)
                const StatusIcon = statusCfg.icon
                const PriorityIcon = priorityCfg.icon
                const TypeIcon = typeCfg.icon

                const labels = safeJsonParseArray<string>(t.labels, [])
                const subtasks = safeJsonParseArray<SubtaskItem>(t.subtasks, [])
                const completedSubtasks = subtasks.filter((s) => s?.completed).length

                return (
                  <tr
                    key={t.id}
                    className={`group transition-colors hover:bg-muted/30 ${
                      isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 pl-4 pr-2 whitespace-nowrap">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect(t.id)}
                        aria-label={`Select ${t.taskKey}`}
                      />
                    </td>

                    {/* Key */}
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span
                        onClick={() => onViewDetails(t)}
                        className="font-mono text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        {t.taskKey}
                      </span>
                    </td>

                    {/* Title & Labels */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 max-w-md">
                        <span
                          onClick={() => onViewDetails(t)}
                          className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1 group-hover:underline"
                        >
                          {t.title}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {labels.map((lbl) => (
                            <span
                              key={lbl}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium whitespace-nowrap"
                            >
                              #{lbl}
                            </span>
                          ))}
                          {subtasks.length > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium whitespace-nowrap">
                              <ListTodo className="size-3" />
                              {completedSubtasks}/{subtasks.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {project ? (
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: project.id }}
                          className="text-xs font-semibold text-foreground/90 hover:text-primary transition-colors truncate max-w-[140px] block cursor-pointer group/link hover:underline"
                          title={project.name}
                        >
                          <span className="font-mono font-bold text-primary mr-1">[{project.key}]</span>
                          {project.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">General</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Menu>
                        <MenuTrigger
                          render={
                            <button
                              type="button"
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap cursor-pointer ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} hover:opacity-80 transition-opacity`}
                            >
                              <StatusIcon className="size-3 shrink-0" />
                              <span>{statusCfg.label}</span>
                            </button>
                          }
                        />
                        <MenuPopup align="start" className="w-36">
                          {(['backlog', 'todo', 'in_progress', 'in_review', 'done'] as TaskStatus[]).map((st) => (
                            <MenuItem key={st} onClick={() => onStatusChange(t.id, st)} className="gap-2 text-xs">
                              {TASK_STATUS_CONFIG[st].label}
                            </MenuItem>
                          ))}
                        </MenuPopup>
                      </Menu>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${priorityCfg.bg} ${priorityCfg.color} ${priorityCfg.border}`}>
                        <PriorityIcon className="size-3 shrink-0" />
                        <span>{priorityCfg.label}</span>
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${typeCfg.color}`}>
                        <TypeIcon className="size-3.5 shrink-0" />
                        <span>{typeCfg.label}</span>
                      </span>
                    </td>

                    {/* Estimate Points */}
                    <td className="py-3 px-3 text-center font-mono text-xs font-bold text-foreground whitespace-nowrap">
                      {t.estimatePoints ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          {t.estimatePoints}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6 border border-border shrink-0">
                          <AvatarImage src={t.assigneeAvatar || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {t.assigneeName ? t.assigneeName[0] : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-foreground truncate max-w-[110px]" title={t.assigneeName || 'Unassigned'}>
                          {t.assigneeName || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                      {t.dueDate ? (
                        <span className="flex items-center gap-1 font-mono text-[11px] whitespace-nowrap">
                          <Calendar className="size-3 shrink-0" /> {t.dueDate}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 pr-4 pl-2 text-right whitespace-nowrap">
                      <Menu>
                        <MenuTrigger
                          render={
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              className="size-7 text-muted-foreground opacity-60 group-hover:opacity-100 cursor-pointer"
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
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
