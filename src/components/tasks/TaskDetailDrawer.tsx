import React, { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import type { Task, TaskStatus, TaskPriority, TaskType, SubtaskItem, CommentItem, SafeUser } from '@/db/schema'
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TASK_TYPE_CONFIG,
} from './types'
import {
  Calendar,
  Tag,
  Trash2,
  CheckCircle2,
  Plus,
  Send,
  MessageSquare,
  ListTodo,
  Zap,
} from 'lucide-react'

interface TaskDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  users: SafeUser[]
  onUpdateTask: (taskData: Partial<Task> & { id: string }) => Promise<void>
  onDeleteTask: (task: Task) => void
  onAddComment: (taskId: string, content: string) => Promise<void>
}

export function TaskDetailDrawer({
  open,
  onOpenChange,
  task,
  users,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
}: TaskDetailDrawerProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [commentContent, setCommentContent] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  if (!task) return null

  const statusCfg = TASK_STATUS_CONFIG[task.status as TaskStatus] || TASK_STATUS_CONFIG.todo
  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority as TaskPriority] || TASK_PRIORITY_CONFIG.medium
  const typeCfg = TASK_TYPE_CONFIG[task.type as TaskType] || TASK_TYPE_CONFIG.feature
  const StatusIcon = statusCfg.icon
  const PriorityIcon = priorityCfg.icon
  const TypeIcon = typeCfg.icon

  let subtasks: SubtaskItem[] = []
  try {
    subtasks = JSON.parse(task.subtasks || '[]')
  } catch {
    subtasks = []
  }

  let comments: CommentItem[] = []
  try {
    comments = JSON.parse(task.comments || '[]')
  } catch {
    comments = []
  }

  let labels: string[] = []
  try {
    labels = JSON.parse(task.labels || '[]')
  } catch {
    labels = []
  }

  const completedSubtasks = subtasks.filter((s) => s.completed).length
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0

  const handleToggleSubtask = async (subtaskId: string) => {
    const updated = subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s))
    await onUpdateTask({ id: task.id, subtasks: JSON.stringify(updated) as any })
  }

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return

    const newItem: SubtaskItem = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false,
    }
    const updated = [...subtasks, newItem]
    setNewSubtaskTitle('')
    await onUpdateTask({ id: task.id, subtasks: JSON.stringify(updated) as any })
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    const updated = subtasks.filter((s) => s.id !== subtaskId)
    await onUpdateTask({ id: task.id, subtasks: JSON.stringify(updated) as any })
  }

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim() || labels.includes(newLabel.trim().toLowerCase())) return

    const updated = [...labels, newLabel.trim().toLowerCase()]
    setNewLabel('')
    await onUpdateTask({ id: task.id, labels: JSON.stringify(updated) as any })
  }

  const handleRemoveLabel = async (tag: string) => {
    const updated = labels.filter((l) => l !== tag)
    await onUpdateTask({ id: task.id, labels: JSON.stringify(updated) as any })
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) return
    setIsSubmittingComment(true)
    try {
      await onAddComment(task.id, commentContent.trim())
      setCommentContent('')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleAssigneeChange = async (userId: string) => {
    if (userId === 'unassigned') {
      await onUpdateTask({ id: task.id, assigneeId: null, assigneeName: null, assigneeAvatar: null })
      return
    }
    const target = users.find((u) => u.id === userId)
    if (target) {
      await onUpdateTask({
        id: task.id,
        assigneeId: target.id,
        assigneeName: target.name,
        assigneeAvatar: target.avatar,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header with Key Breadcrumb and Status */}
        <DialogHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-primary border border-border/70">
                {task.taskKey}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeCfg.color} bg-card`}>
                <TypeIcon className="size-3.5" />
                {typeCfg.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityCfg.bg} ${priorityCfg.color} ${priorityCfg.border}`}>
                <PriorityIcon className="size-3.5" />
                {priorityCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                <StatusIcon className="size-3.5" />
                {statusCfg.label}
              </span>
            </div>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-foreground mt-2">
            {task.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Created on {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'} • Last updated {task.updatedAt ? new Date(task.updatedAt).toLocaleTimeString() : 'N/A'}
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="space-y-6 py-4">
          {/* Main Grid: Left Details & Right Metadata Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Description, Subtasks, Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  Description & Context
                </h4>
                <div className="rounded-xl border border-border/70 bg-card/85 p-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {task.description || 'No detailed description provided for this task.'}
                </div>
              </div>

              {/* Subtasks Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ListTodo className="size-3.5" />
                    Subtasks Checklist ({completedSubtasks}/{subtasks.length})
                  </h4>
                  {subtasks.length > 0 && (
                    <span className="text-xs font-bold text-foreground">{subtaskProgress}%</span>
                  )}
                </div>

                {subtasks.length > 0 && (
                  <Progress value={subtaskProgress} className="h-1.5 w-full" />
                )}

                <div className="space-y-1.5">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="group flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/50 bg-card/60 hover:bg-card transition-colors"
                    >
                      <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer flex-1 min-w-0">
                        <Checkbox
                          checked={st.completed}
                          onCheckedChange={() => handleToggleSubtask(st.id)}
                        />
                        <span className={`truncate ${st.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {st.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask input */}
                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a new checklist step..."
                    className="h-8 text-xs bg-background"
                  />
                  <Button size="xs" type="submit" variant="outline" className="gap-1 h-8">
                    <Plus className="size-3" /> Add
                  </Button>
                </form>
              </div>

              {/* Discussion & Activity Thread */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="size-3.5" />
                  Discussion Thread ({comments.length})
                </h4>

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground/70 italic p-3 border border-dashed border-border/60 rounded-xl text-center">
                      No comments yet. Start the discussion below.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarImage src={comment.authorAvatar} />
                              <AvatarFallback className="text-[10px]">
                                {comment.authorName ? comment.authorName[0] : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold text-foreground">
                              {comment.authorName}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 pl-8 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Box */}
                <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2">
                  <Input
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="h-9 text-xs bg-background flex-1"
                  />
                  <Button
                    size="sm"
                    type="submit"
                    disabled={isSubmittingComment || !commentContent.trim()}
                    className="gap-1.5 h-9"
                  >
                    {isSubmittingComment ? <Spinner className="size-3.5" /> : <Send className="size-3.5" />}
                    Reply
                  </Button>
                </form>
              </div>
            </div>

            {/* Right Column: Metadata Sidebar */}
            <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 h-fit">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                Task Properties
              </span>

              {/* Status Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['backlog', 'todo', 'in_progress', 'in_review', 'done'] as TaskStatus[]).map((st) => {
                    const isCur = task.status === st
                    return (
                      <Button
                        key={st}
                        size="xs"
                        variant={isCur ? 'default' : 'outline'}
                        type="button"
                        onClick={() => onUpdateTask({ id: task.id, status: st })}
                        className="text-[11px] h-7 capitalize justify-start gap-1"
                      >
                        {isCur && <CheckCircle2 className="size-3 text-emerald-400" />}
                        {TASK_STATUS_CONFIG[st].label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Priority Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((pr) => {
                    const isCur = task.priority === pr
                    return (
                      <Button
                        key={pr}
                        size="xs"
                        variant={isCur ? 'default' : 'outline'}
                        type="button"
                        onClick={() => onUpdateTask({ id: task.id, priority: pr })}
                        className="text-[11px] h-7 capitalize justify-start gap-1"
                      >
                        {TASK_PRIORITY_CONFIG[pr].label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Assignee Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Assignee
                </label>
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-card">
                  <Avatar className="size-7 border border-border">
                    <AvatarImage src={task.assigneeAvatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {task.assigneeName ? task.assigneeName[0] : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-foreground flex-1 truncate">
                    {task.assigneeName || 'Unassigned'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mt-1">
                  {users.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleAssigneeChange(u.id)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                        task.assigneeId === u.id
                          ? 'bg-primary text-primary-foreground font-semibold border-primary'
                          : 'bg-card text-muted-foreground hover:text-foreground border-border/70'
                      }`}
                    >
                      {u.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimate Points */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Zap className="size-3 text-amber-500" /> Story Points Estimate
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 5, 8, 13].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => onUpdateTask({ id: task.id, estimatePoints: pts })}
                      className={`size-7 rounded-md text-xs font-bold transition-all ${
                        task.estimatePoints === pts
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-card border border-border/70 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {pts}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" /> Due Date
                </label>
                <Input
                  type="date"
                  value={task.dueDate || ''}
                  onChange={(e) => onUpdateTask({ id: task.id, dueDate: e.target.value || null })}
                  className="h-8 text-xs bg-card"
                />
              </div>

              {/* Labels */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Tag className="size-3" /> Labels
                </label>
                <div className="flex flex-wrap gap-1">
                  {labels.map((l) => (
                    <span
                      key={l}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-foreground"
                    >
                      #{l}
                      <button
                        type="button"
                        onClick={() => handleRemoveLabel(l)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddLabel} className="flex gap-1 pt-1">
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Add tag..."
                    className="h-7 text-xs bg-card"
                  />
                  <Button size="xs" type="submit" variant="outline" className="h-7 px-2">
                    +
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </DialogPanel>

        <DialogFooter className="mt-4 flex-wrap gap-2 justify-between border-t border-border/50 pt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDeleteTask(task)
              onOpenChange(false)
            }}
            className="gap-1.5 text-xs"
          >
            <Trash2 className="size-3.5" />
            Delete Task
          </Button>

          <div className="flex items-center gap-2">
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Close
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
