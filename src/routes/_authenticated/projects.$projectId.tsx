import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { useState, useTransition, useMemo } from 'react'
import { getProjectByIdFn, updateProjectFn } from '@/server/projects'
import {
  getTasksFn,
  createTaskFn,
  updateTaskFn,
  deleteTaskFn,
  addCommentToTaskFn,
} from '@/server/tasks'
import { getUsersFn } from '@/server/users'
import { TaskKanbanView } from '@/components/tasks/TaskKanbanView'
import { TaskTableView } from '@/components/tasks/TaskTableView'
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer'
import { TaskModal } from '@/components/tasks/TaskModal'
import { ProjectModal } from '@/components/projects/ProjectModal'
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { SuccessCheckIcon } from '@/components/ui/transitions'
import type { Task, TaskStatus, ProjectHealth, SafeUser } from '@/db/schema'
import {
  PROJECT_HEALTH_CONFIG,
  PROJECT_COLOR_MAP,
  PROJECT_ICONS,
  TASK_STATUS_CONFIG,
} from '@/components/tasks/types'
import {
  Folder,
  LayoutGrid,
  List,
  Plus,
  Search,
  Edit,
  ArrowLeft,
  BarChart3,
  Layers,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  loader: async ({ params }) => {
    const [project, tasks, users] = await Promise.all([
      getProjectByIdFn({ data: { id: params.projectId } }),
      getTasksFn({ data: { projectId: params.projectId } }),
      getUsersFn(),
    ])
    return { project, tasks, users }
  },
  component: ProjectWorkspacePage,
})

function ProjectWorkspacePage() {
  const { project, tasks, users } = Route.useLoaderData()
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [activeTab, setActiveTab] = useState<'board' | 'list' | 'overview'>('board')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Modals & Drawers state
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<TaskStatus>('todo')

  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null)

  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)

  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false)

  const [isDeleteTaskDialogOpen, setIsDeleteTaskDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Derive active task for drawer dynamically
  const activeDetailTask = useMemo(() => {
    if (!selectedTaskForDetail) return null
    return tasks.find((t: Task) => t.id === selectedTaskForDetail.id) || selectedTaskForDetail
  }, [tasks, selectedTaskForDetail])

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t: Task) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const match = t.title.toLowerCase().includes(q) || t.taskKey.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
        if (!match) return false
      }
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      return true
    })
  }, [tasks, search, priorityFilter, typeFilter])

  const healthCfg = PROJECT_HEALTH_CONFIG[project.health as ProjectHealth] || PROJECT_HEALTH_CONFIG.on_track
  const colorCfg = PROJECT_COLOR_MAP[project.color] || PROJECT_COLOR_MAP.sky
  const IconComp = PROJECT_ICONS[project.icon] || Folder

  // Actions
  const handleCreateTask = async (data: any) => {
    setIsSubmitting(true)
    try {
      await createTaskFn({ data })
      showToast('Task created successfully', 'success')
      startTransition(() => {
        router.invalidate()
      })
    } catch (err: any) {
      showToast(err?.message || 'Failed to create task', 'error')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTask = async (data: any) => {
    try {
      await updateTaskFn({ data })
      startTransition(() => {
        router.invalidate()
      })
      showToast('Task updated', 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to update task', 'error')
      throw err
    }
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await updateTaskFn({ data: { id, status } })
      startTransition(() => {
        router.invalidate()
      })
    } catch (err: any) {
      showToast(err?.message || 'Failed to update stage', 'error')
    }
  }

  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return
    setIsSubmitting(true)
    try {
      await deleteTaskFn({ data: { id: taskToDelete.id } })
      startTransition(() => {
        router.invalidate()
      })
      showToast('Task deleted', 'info')
      setIsDeleteTaskDialogOpen(false)
      setTaskToDelete(null)
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete task', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddComment = async (taskId: string, content: string) => {
    try {
      const activeUser = users[0]
      await addCommentToTaskFn({
        data: {
          taskId,
          authorName: activeUser?.name || 'Elena Rostova',
          authorAvatar: activeUser?.avatar || undefined,
          content,
        },
      })
      startTransition(() => {
        router.invalidate()
      })
      showToast('Comment posted', 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to post comment', 'error')
    }
  }

  const handleOpenCreateWithStatus = (status: TaskStatus) => {
    setCreateTaskDefaultStatus(status)
    setIsCreateTaskModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200 text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : toast.type === 'error'
              ? 'bg-destructive/10 text-destructive border-destructive/30'
              : 'bg-card text-foreground border-border'
          }`}
        >
          {toast.type === 'success' && <SuccessCheckIcon size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Back Link & Project Header Banner */}
      <div className="rounded-3xl border border-border/70 bg-card/85 p-6 backdrop-blur-md shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to Projects
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsEditProjectModalOpen(true)}
              className="gap-1.5 text-xs h-8"
            >
              <Edit className="size-3.5" /> Edit Project
            </Button>
            <Button
              size="xs"
              onClick={() => handleOpenCreateWithStatus('todo')}
              className="gap-1.5 text-xs h-8 shadow-xs font-semibold"
            >
              <Plus className="size-3.5" /> New Task
            </Button>
          </div>
        </div>

        {/* Project Meta Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2 border-t border-border/40">
          <div className="flex items-start gap-4">
            <div className={`flex size-12 items-center justify-center rounded-2xl ${colorCfg.bg} ${colorCfg.text} ${colorCfg.border} border shadow-xs`}>
              <IconComp className="size-6" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-primary border border-border/70">
                  {project.key}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${healthCfg.bg} ${healthCfg.color} ${healthCfg.border}`}>
                  <span className={`size-1.5 rounded-full ${healthCfg.dot}`} />
                  {healthCfg.label}
                </span>
                <Badge variant="outline" className="text-xs capitalize font-medium">
                  {project.status}
                </Badge>
              </div>

              <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
                {project.name}
              </h1>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                {project.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics on Right */}
          <div className="flex items-center gap-6 self-start lg:self-center border-t lg:border-t-0 lg:border-l border-border/50 pt-3 lg:pt-0 lg:pl-6">
            <div className="space-y-1 min-w-[140px]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Progress</span>
                <span className="font-bold text-foreground">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
              <span className="text-[10px] text-muted-foreground block">
                {project.completedTasks}/{project.totalTasks} tasks completed
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                Project Lead
              </span>
              <div className="flex items-center gap-1.5">
                <Avatar className="size-6 border border-border">
                  <AvatarImage src={project.leadAvatar || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {project.leadName ? project.leadName[0] : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-foreground">
                  {project.leadName || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation View Tabs & Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl border border-border/70 bg-card/85 backdrop-blur-md">
        {/* View Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/50 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'board'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="size-3.5" /> Board
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="size-3.5" /> Table
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="size-3.5" /> Overview & Timeline
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[180px] flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          <Select
            value={priorityFilter}
            onValueChange={(val) => setPriorityFilter((val as string) || 'all')}
          >
            <SelectTrigger className="h-8 min-w-32 bg-background text-xs font-medium capitalize">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all" className="text-xs">All Priorities</SelectItem>
              <SelectItem value="urgent" className="text-xs">🔴 Urgent</SelectItem>
              <SelectItem value="high" className="text-xs">🟠 High</SelectItem>
              <SelectItem value="medium" className="text-xs">🔵 Medium</SelectItem>
              <SelectItem value="low" className="text-xs">⚪ Low</SelectItem>
            </SelectPopup>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter((val as string) || 'all')}
          >
            <SelectTrigger className="h-8 min-w-28 bg-background text-xs font-medium capitalize">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all" className="text-xs">All Types</SelectItem>
              <SelectItem value="feature" className="text-xs">Feature</SelectItem>
              <SelectItem value="bug" className="text-xs">Bug</SelectItem>
              <SelectItem value="task" className="text-xs">Task</SelectItem>
              <SelectItem value="improvement" className="text-xs">Improvement</SelectItem>
            </SelectPopup>
          </Select>
        </div>
      </div>

      {/* Main Content Body */}
      {activeTab === 'board' && (
        <TaskKanbanView
          tasks={filteredTasks}
          onViewDetails={(t) => {
            setSelectedTaskForDetail(t)
            setIsDetailDrawerOpen(true)
          }}
          onEdit={(t) => {
            setSelectedTaskForEdit(t)
            setIsEditTaskModalOpen(true)
          }}
          onDelete={(t) => {
            setTaskToDelete(t)
            setIsDeleteTaskDialogOpen(true)
          }}
          onStatusChange={handleStatusChange}
          onOpenCreateModalWithStatus={handleOpenCreateWithStatus}
        />
      )}

      {activeTab === 'list' && (
        <TaskTableView
          tasks={filteredTasks}
          projects={[project]}
          selectedIds={selectedTaskIds}
          onToggleSelect={(id) =>
            setSelectedTaskIds((prev) =>
              prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
            )
          }
          onToggleSelectAll={() => {
            if (selectedTaskIds.length === filteredTasks.length) {
              setSelectedTaskIds([])
            } else {
              setSelectedTaskIds(filteredTasks.map((t) => t.id))
            }
          }}
          onViewDetails={(t) => {
            setSelectedTaskForDetail(t)
            setIsDetailDrawerOpen(true)
          }}
          onEdit={(t) => {
            setSelectedTaskForEdit(t)
            setIsEditTaskModalOpen(true)
          }}
          onDelete={(t) => {
            setTaskToDelete(t)
            setIsDeleteTaskDialogOpen(true)
          }}
          onStatusChange={handleStatusChange}
          onOpenCreateModal={() => handleOpenCreateWithStatus('todo')}
        />
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Details Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card/85 p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                Milestone & Delivery Targets
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Start Date</span>
                  <p className="text-sm font-bold text-foreground font-mono">
                    {project.startDate || 'Not specified'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Target Release</span>
                  <p className="text-sm font-bold text-foreground font-mono">
                    {project.targetDate || 'Not specified'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Allocated Budget</span>
                  <p className="text-sm font-bold text-foreground font-mono">
                    ${(project.budget || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Task Breakdown by Stage */}
            <div className="rounded-2xl border border-border/70 bg-card/85 p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-foreground">Task Stage Distribution</h3>
              <div className="space-y-3">
                {(['backlog', 'todo', 'in_progress', 'in_review', 'done'] as TaskStatus[]).map((st) => {
                  const stageCount = tasks.filter((t: Task) => t.status === st).length
                  const pct = tasks.length > 0 ? Math.round((stageCount / tasks.length) * 100) : 0
                  const cfg = TASK_STATUS_CONFIG[st]
                  const Icon = cfg.icon

                  return (
                    <div key={st} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Icon className={`size-3.5 ${cfg.color}`} />
                          {cfg.label}
                        </span>
                        <span className="text-muted-foreground font-medium">
                          {stageCount} tasks ({pct}%)
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Project Summary sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card/85 p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-foreground">Team Contributors</h3>
              <div className="space-y-2">
                {users.slice(0, 5).map((u: SafeUser) => {
                  const assignedCount = tasks.filter((t: Task) => t.assigneeId === u.id).length
                  return (
                    <div key={u.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-border/40">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7 border border-border">
                          <AvatarImage src={u.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {u.name ? u.name[0] : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-xs font-semibold text-foreground block">{u.name}</span>
                          <span className="text-[10px] text-muted-foreground">{u.role}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted">
                        {assignedCount} tasks
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      <TaskModal
        open={isCreateTaskModalOpen}
        onOpenChange={setIsCreateTaskModalOpen}
        projects={[project]}
        users={users}
        defaultProjectId={project.id}
        defaultStatus={createTaskDefaultStatus}
        onSubmit={handleCreateTask}
        isSubmitting={isSubmitting}
      />

      {/* Task Edit Modal */}
      <TaskModal
        open={isEditTaskModalOpen}
        onOpenChange={setIsEditTaskModalOpen}
        task={selectedTaskForEdit}
        projects={[project]}
        users={users}
        defaultProjectId={project.id}
        onSubmit={handleUpdateTask}
        isSubmitting={isSubmitting}
      />

      {/* Task Detail Inspection Drawer */}
      <TaskDetailDrawer
        open={isDetailDrawerOpen}
        onOpenChange={setIsDetailDrawerOpen}
        task={activeDetailTask}
        users={users}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={(t) => {
          setTaskToDelete(t)
          setIsDeleteTaskDialogOpen(true)
        }}
        onAddComment={handleAddComment}
      />

      {/* Project Edit Modal */}
      <ProjectModal
        open={isEditProjectModalOpen}
        onOpenChange={setIsEditProjectModalOpen}
        project={project}
        users={users}
        onSubmit={async (data) => {
          await updateProjectFn({ data: data as any })
          startTransition(() => {
            router.invalidate()
          })
          showToast('Project settings updated', 'success')
        }}
        isSubmitting={isSubmitting}
      />

      {/* Delete Task Dialog */}
      <DeleteConfirmDialog
        open={isDeleteTaskDialogOpen}
        onOpenChange={setIsDeleteTaskDialogOpen}
        title={taskToDelete?.title || 'this task'}
        onConfirm={handleDeleteTaskConfirm}
        isDeleting={isSubmitting}
      />
    </div>
  )
}
