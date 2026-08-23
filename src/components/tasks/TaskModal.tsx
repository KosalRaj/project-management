import React, { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useShakeError } from '@/components/ui/transitions'
import { cn, safeJsonParseArray } from '@/lib/utils'
import type { Task, Project, SafeUser, TaskStatus, TaskPriority, TaskType } from '@/db/schema'
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TASK_TYPE_CONFIG,
} from './types'
import {
  CheckSquare,
  AlertCircle,
  Calendar,
  Zap,
  Tag,
  User,
  Folder,
} from 'lucide-react'

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  projects: Project[]
  users: SafeUser[]
  defaultProjectId?: string
  defaultStatus?: TaskStatus
  onSubmit: (data: {
    id?: string
    projectId: string
    title: string
    description?: string
    status: TaskStatus
    priority: TaskPriority
    type: TaskType
    estimatePoints?: number | null
    assigneeId?: string
    assigneeName?: string
    assigneeAvatar?: string
    dueDate?: string
    labels: string[]
    subtasks: { id: string; title: string; completed: boolean }[]
    attachments?: any[]
  }) => Promise<void>
  isSubmitting?: boolean
}

export function TaskModal({
  open,
  onOpenChange,
  task,
  projects,
  users,
  defaultProjectId,
  defaultStatus = 'todo',
  onSubmit,
  isSubmitting = false,
}: TaskModalProps) {
  const isEdit = !!task && !!task.id

  const [projectId, setProjectId] = useState(defaultProjectId || (projects[0]?.id ?? ''))
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>(defaultStatus)
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [type, setType] = useState<TaskType>('feature')
  const [estimatePoints, setEstimatePoints] = useState<number | null>(3)
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [labelsInput, setLabelsInput] = useState('')

  const shake = useShakeError(3500)

  useEffect(() => {
    if (task && task.id) {
      setProjectId(task.projectId)
      setTitle(task.title || '')
      setDescription(task.description || '')
      setStatus((task.status as TaskStatus) || 'todo')
      setPriority((task.priority as TaskPriority) || 'medium')
      setType((task.type as TaskType) || 'feature')
      setEstimatePoints(task.estimatePoints ?? null)
      setAssigneeId(task.assigneeId || '')
      setDueDate(task.dueDate || '')
      const parsedLabels = safeJsonParseArray<string>(task.labels, [])
      setLabelsInput(parsedLabels.join(', '))
    } else {
      setProjectId(defaultProjectId || (projects[0]?.id ?? ''))
      setTitle('')
      setDescription('')
      setStatus(defaultStatus)
      setPriority('medium')
      setType('feature')
      setEstimatePoints(3)
      setAssigneeId(users[0]?.id ?? '')
      setDueDate('')
      setLabelsInput('')
    }
    shake.clearError()
  }, [task, open, defaultProjectId, defaultStatus, projects, users])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    shake.clearError()

    if (!title.trim()) {
      shake.triggerError('Task title is required.')
      return
    }

    if (!projectId) {
      shake.triggerError('Please select a project.')
      return
    }

    const assignedUser = users.find((u) => u.id === assigneeId)
    const parsedLabels = labelsInput
      .split(',')
      .map((l) => l.trim().toLowerCase())
      .filter(Boolean)

    const existingSubtasks = task ? safeJsonParseArray(task.subtasks, []) : []

    try {
      await onSubmit({
        id: task?.id,
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        type,
        estimatePoints,
        assigneeId: assignedUser?.id || undefined,
        assigneeName: assignedUser?.name || undefined,
        assigneeAvatar: assignedUser?.avatar || undefined,
        dueDate: dueDate || undefined,
        labels: parsedLabels,
        subtasks: existingSubtasks,
      })
      onOpenChange(false)
    } catch (err: any) {
      shake.triggerError(err?.message || 'Failed to save task')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className={cn('sm:max-w-xl', shake.isShaking && 'is-shaking')}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <CheckSquare className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {isEdit ? 'Edit Task / Issue' : 'Create New Task'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isEdit ? `Updating task ${task?.taskKey}` : 'Assign work, set priority estimates, and track sprint items.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="contents">
          <DialogPanel className="space-y-4.5">
            {shake.errorText && (
              <div className="t-error-msg p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{shake.errorText}</span>
              </div>
            )}

            {/* Project Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Folder className="size-3.5" /> Project <span className="text-destructive">*</span>
              </label>
              <Select
                value={projectId}
                onValueChange={(val) => setProjectId((val as string) || '')}
              >
                <SelectTrigger className="h-9 w-full bg-background text-xs font-medium px-2.5">
                  <SelectValue placeholder="Select Project">
                    {(val) => {
                      const p = projects.find((proj) => proj.id === val)
                      return p ? `[${p.key}] ${p.name}` : 'Select Project'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <span className="font-mono font-bold mr-1.5 text-primary">[{p.key}]</span> {p.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <span>Task Title</span> <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement WebAuthn authentication protocol"
                required
                autoFocus
                className={cn('text-sm h-9 bg-background', shake.isError && 'border-destructive ring-destructive/20')}
              />
            </div>

            {/* Type & Priority & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Type
                </label>
                <Select
                  value={type}
                  onValueChange={(val) => setType((val as TaskType) || 'feature')}
                >
                  <SelectTrigger className="h-9 w-full bg-background text-xs font-medium capitalize px-2.5">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectPopup>
                    {Object.entries(TASK_TYPE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs capitalize">
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Priority
                </label>
                <Select
                  value={priority}
                  onValueChange={(val) => setPriority((val as TaskPriority) || 'medium')}
                >
                  <SelectTrigger className="h-9 w-full bg-background text-xs font-medium capitalize px-2.5">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectPopup>
                    {Object.entries(TASK_PRIORITY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs capitalize">
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Status
                </label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus((val as TaskStatus) || 'todo')}
                >
                  <SelectTrigger className="h-9 w-full bg-background text-xs font-medium capitalize px-2.5">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectPopup>
                    {Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs capitalize">
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
            </div>

            {/* Assignee & Story Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <User className="size-3.5" /> Assignee
                </label>
                <Select
                  value={assigneeId || 'unassigned'}
                  onValueChange={(val) => setAssigneeId(val === 'unassigned' ? '' : (val as string))}
                >
                  <SelectTrigger className="h-9 w-full bg-background text-xs font-medium px-2.5">
                    <SelectValue placeholder="Assignee">
                      {(val) => {
                        if (!val || val === 'unassigned') {
                          return (
                            <span className="flex items-center gap-2 text-muted-foreground truncate">
                              <User className="size-3.5 text-muted-foreground/60" />
                              <span>Unassigned</span>
                            </span>
                          )
                        }
                        const u = users.find((user) => user.id === val)
                        if (!u) return 'Unassigned'
                        const initials = u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                        return (
                          <span className="flex items-center gap-2 truncate">
                            <Avatar className="size-5 shrink-0">
                              {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                              <AvatarFallback className="text-[9px] font-semibold">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="truncate font-medium text-foreground">{u.name}</span>
                            <span className="text-[11px] text-muted-foreground truncate">({u.role})</span>
                          </span>
                        )
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="unassigned" className="text-xs">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <User className="size-3.5" />
                        <span>Unassigned</span>
                      </span>
                    </SelectItem>
                    {users.map((u) => {
                      const initials = u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                      return (
                        <SelectItem key={u.id} value={u.id} className="py-1.5 text-xs">
                          <span className="flex items-center gap-2">
                            <Avatar className="size-5 shrink-0">
                              {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                              <AvatarFallback className="text-[9px] font-semibold">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{u.name}</span>
                            <span className="text-muted-foreground text-[11px]">({u.role})</span>
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectPopup>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Zap className="size-3.5 text-amber-500" /> Story Points Estimate
                </label>
                <Select
                  value={estimatePoints ? String(estimatePoints) : 'none'}
                  onValueChange={(val) => setEstimatePoints(val === 'none' ? null : Number(val))}
                >
                  <SelectTrigger className="h-9 w-full bg-background text-xs font-medium px-2.5">
                    <SelectValue placeholder="Story Points">
                      {(val) => {
                        if (!val || val === 'none') return 'No estimate'
                        return `${val} points`
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="none" className="text-xs">No estimate</SelectItem>
                    <SelectItem value="1" className="text-xs">1 point (Quick fix)</SelectItem>
                    <SelectItem value="2" className="text-xs">2 points (Minor)</SelectItem>
                    <SelectItem value="3" className="text-xs">3 points (Standard)</SelectItem>
                    <SelectItem value="5" className="text-xs">5 points (Complex)</SelectItem>
                    <SelectItem value="8" className="text-xs">8 points (Epic sub-track)</SelectItem>
                    <SelectItem value="13" className="text-xs">13 points (Major architectural shift)</SelectItem>
                  </SelectPopup>
                </Select>
              </div>
            </div>

            {/* Due Date & Labels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Calendar className="size-3.5" /> Due Date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-xs h-9 bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Tag className="size-3.5" /> Labels (comma separated)
                </label>
                <Input
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder="backend, api, security"
                  className="text-xs h-9 bg-background"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Description & Acceptance Criteria
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add technical context, reproduction steps, or milestone requirements..."
                rows={3}
                className="bg-background text-xs"
              />
            </div>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="default" type="button" />}>
              Cancel
            </DialogClose>
            <Button size="default" type="submit" disabled={isSubmitting} className="gap-1.5 shadow-xs">
              {isSubmitting && <Spinner className="size-3.5" />}
              {isEdit ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
