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
import { Spinner } from '@/components/ui/spinner'
import { useShakeError } from '@/components/ui/transitions'
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
      try {
        const parsed = JSON.parse(task.labels || '[]')
        setLabelsInput(Array.isArray(parsed) ? parsed.join(', ') : '')
      } catch {
        setLabelsInput('')
      }
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

    let existingSubtasks: any[] = []
    if (task) {
      try {
        existingSubtasks = JSON.parse(task.subtasks || '[]')
      } catch {
        existingSubtasks = []
      }
    }

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
      <DialogPopup className={`max-w-xl max-h-[90vh] overflow-y-auto ${shake.isShaking ? 'is-shaking' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="size-5 text-primary" />
            {isEdit ? 'Edit Task / Issue' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEdit ? `Updating task ${task?.taskKey}` : 'Assign work, set priority estimates, and track sprint items.'}
          </DialogDescription>
        </DialogHeader>

        {shake.errorText && (
          <div className="t-error-msg p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2 mx-6 mt-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{shake.errorText}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <DialogPanel className="space-y-4">
            {/* Project Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Folder className="size-3.5" /> Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Task Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement WebAuthn authentication protocol"
                required
                className={`text-sm h-9 bg-background ${shake.isError ? 'border-destructive ring-destructive/20' : ''}`}
              />
            </div>

            {/* Type & Priority & Status */}
            <div className="grid grid-cols-3 gap-3">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                >
                  {Object.entries(TASK_TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                >
                  {Object.entries(TASK_PRIORITY_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                >
                  {Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee & Story Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <User className="size-3.5" /> Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Zap className="size-3.5 text-amber-500" /> Story Points Estimate
                </label>
                <select
                  value={estimatePoints ?? ''}
                  onChange={(e) => setEstimatePoints(e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No estimate</option>
                  <option value="1">1 point (Quick fix)</option>
                  <option value="2">2 points (Minor)</option>
                  <option value="3">3 points (Standard)</option>
                  <option value="5">5 points (Complex)</option>
                  <option value="8">8 points (Epic sub-track)</option>
                  <option value="13">13 points (Major architectural shift)</option>
                </select>
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
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add technical context, reproduction steps, or milestone requirements..."
                rows={3}
                className="w-full p-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            </div>
          </DialogPanel>

          <DialogFooter className="border-t border-border/50 pt-3">
            <DialogClose render={<Button variant="outline" size="sm" type="button" />}>
              Cancel
            </DialogClose>
            <Button size="sm" type="submit" disabled={isSubmitting} className="gap-1.5 shadow-xs">
              {isSubmitting && <Spinner className="size-3.5" />}
              {isEdit ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
