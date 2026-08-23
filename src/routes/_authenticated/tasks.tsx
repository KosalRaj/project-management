import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useTransition, useMemo } from 'react'
import { getProjectsFn } from '@/server/projects'
import {
  getTasksFn,
  createTaskFn,
  updateTaskFn,
  deleteTaskFn,
  batchUpdateTasksFn,
  addCommentToTaskFn,
} from '@/server/tasks'
import { getUsersFn } from '@/server/users'
import { useAuth } from '@/lib/auth-context'
import { TaskKanbanView } from '@/components/tasks/TaskKanbanView'
import { TaskTableView } from '@/components/tasks/TaskTableView'
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer'
import { TaskModal } from '@/components/tasks/TaskModal'
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
import { SuccessCheckIcon } from '@/components/ui/transitions'
import { exportTasksToCsv, exportTasksToJson } from '@/lib/export-utils'
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
} from '@/components/ui/menu'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus, TaskPriority, TaskType } from '@/db/schema'
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TASK_TYPE_CONFIG,
} from '@/components/tasks/types'
import {
  CheckSquare,
  LayoutGrid,
  List,
  Plus,
  Search,
  Trash2,
  X,
  Download,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/tasks')({
  loader: async () => {
    const [projects, tasks, users] = await Promise.all([
      getProjectsFn(),
      getTasksFn(),
      getUsersFn(),
    ])
    return { projects, tasks, users }
  },
  component: TasksPage,
})

function TasksPage() {
  const { projects, tasks, users } = Route.useLoaderData()
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [, startTransition] = useTransition()

  // State
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table')
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'my_tasks' | 'urgent' | 'in_progress'>('all')

  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  // Modal & Drawer
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<TaskStatus>('todo')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null)

  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
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
      // Quick preset view
      if (activeQuickFilter === 'my_tasks') {
        if (!currentUser?.id || t.assigneeId !== currentUser.id) return false
      } else if (activeQuickFilter === 'urgent') {
        if (t.priority !== 'urgent' && t.priority !== 'high') return false
      } else if (activeQuickFilter === 'in_progress') {
        if (t.status !== 'in_progress' && t.status !== 'in_review') return false
      }

      if (search.trim()) {
        const q = search.toLowerCase()
        const match =
          t.title.toLowerCase().includes(q) ||
          t.taskKey.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
        if (!match) return false
      }

      if (projectFilter !== 'all' && t.projectId !== projectFilter) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false

      return true
    })
  }, [
    tasks,
    activeQuickFilter,
    currentUser,
    search,
    projectFilter,
    statusFilter,
    priorityFilter,
    typeFilter,
  ])

  // Action handlers
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
      showToast(err?.message || 'Failed to update status', 'error')
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
      setIsDeleteDialogOpen(false)
      setTaskToDelete(null)
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete task', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBatchStatus = async (status: TaskStatus) => {
    if (selectedTaskIds.length === 0) return
    try {
      await batchUpdateTasksFn({ data: { ids: selectedTaskIds, action: 'status', value: status } })
      startTransition(() => {
        router.invalidate()
      })
      showToast(`Updated ${selectedTaskIds.length} tasks to ${status}`, 'success')
      setSelectedTaskIds([])
    } catch (err: any) {
      showToast('Batch update failed', 'error')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedTaskIds.length === 0) return
    try {
      await batchUpdateTasksFn({ data: { ids: selectedTaskIds, action: 'delete' } })
      startTransition(() => {
        router.invalidate()
      })
      showToast(`Deleted ${selectedTaskIds.length} tasks`, 'info')
      setSelectedTaskIds([])
    } catch (err: any) {
      showToast('Batch delete failed', 'error')
    }
  }

  const handleAddComment = async (taskId: string, content: string) => {
    try {
      await addCommentToTaskFn({
        data: {
          taskId,
          authorName: currentUser?.name || 'Elena Rostova',
          authorAvatar: currentUser?.avatar || undefined,
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="size-5 text-primary" />
            Task & Issue Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-project issue registry with story points estimation, subtasks, and sprint boards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <List className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'board' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>

          {/* Export Dropdown */}
          <Menu>
            <MenuTrigger className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-border/70 bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shadow-2xs">
              <Download className="size-3.5 text-muted-foreground" />
              <span>Export</span>
            </MenuTrigger>
            <MenuPopup align="end" className="w-48">
              <MenuItem
                onClick={() => {
                  exportTasksToCsv(filteredTasks, projects)
                  showToast('Exported tasks to CSV', 'success')
                }}
                className="gap-2 text-xs"
              >
                <FileSpreadsheet className="size-3.5 text-emerald-500" />
                Export to CSV
              </MenuItem>
              <MenuItem
                onClick={() => {
                  exportTasksToJson(filteredTasks)
                  showToast('Exported tasks to JSON backup', 'success')
                }}
                className="gap-2 text-xs"
              >
                <FileCode className="size-3.5 text-sky-500" />
                Export to JSON Backup
              </MenuItem>
            </MenuPopup>
          </Menu>

          <Button
            onClick={() => {
              setCreateTaskDefaultStatus('todo')
              setIsCreateModalOpen(true)
            }}
            className="gap-2 shadow-sm font-semibold h-9 text-xs"
          >
            <Plus className="size-4" /> New Task
          </Button>
        </div>
      </div>

      {/* Quick View Presets Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveQuickFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap',
            activeQuickFilter === 'all'
              ? 'bg-primary/10 text-primary border-primary/20 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30 shadow-xs'
              : 'bg-card text-muted-foreground hover:text-foreground border-border/70'
          )}
        >
          All Issues ({tasks.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveQuickFilter('my_tasks')}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap',
            activeQuickFilter === 'my_tasks'
              ? 'bg-primary/10 text-primary border-primary/20 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30 shadow-xs'
              : 'bg-card text-muted-foreground hover:text-foreground border-border/70'
          )}
        >
          My Assigned Tasks
        </button>

        <button
          type="button"
          onClick={() => setActiveQuickFilter('urgent')}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap',
            activeQuickFilter === 'urgent'
              ? 'bg-primary/10 text-primary border-primary/20 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30 shadow-xs'
              : 'bg-card text-muted-foreground hover:text-foreground border-border/70'
          )}
        >
          🔥 Urgent & High Priority
        </button>

        <button
          type="button"
          onClick={() => setActiveQuickFilter('in_progress')}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap',
            activeQuickFilter === 'in_progress'
              ? 'bg-primary/10 text-primary border-primary/20 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30 shadow-xs'
              : 'bg-card text-muted-foreground hover:text-foreground border-border/70'
          )}
        >
          ⚡ In Progress & Review
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 p-3 rounded-2xl border border-border/70 bg-card/85 backdrop-blur-md">
        <div className="relative w-full xl:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, key, or notes..."
            className="pl-8 pr-8 h-8 text-xs bg-background"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Project Filter */}
          <Select
            value={projectFilter}
            onValueChange={(val) => setProjectFilter((val as string) || 'all')}
          >
            <SelectTrigger className="h-8 w-full sm:w-auto sm:min-w-[130px] bg-background text-xs font-medium px-2.5">
              <SelectValue placeholder="All Projects">
                {(val) => {
                  if (val === 'all' || !val) return 'All Projects'
                  const p = projects.find((proj: any) => proj.id === val)
                  return p ? (
                    <span className="truncate">
                      <span className="font-mono font-bold text-primary mr-1">[{p.key}]</span>
                      {p.name}
                    </span>
                  ) : (
                    'All Projects'
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all" className="text-xs">All Projects</SelectItem>
              {projects.map((p: any) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  <span className="font-mono font-bold mr-1.5 text-primary">[{p.key}]</span> {p.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter((val as string) || 'all')}
          >
            <SelectTrigger className="h-8 w-full sm:w-auto sm:min-w-[120px] bg-background text-xs font-medium capitalize px-2.5">
              <SelectValue placeholder="All Statuses">
                {(val) => {
                  if (val === 'all' || !val) return 'All Statuses'
                  const cfg = TASK_STATUS_CONFIG[val as TaskStatus]
                  if (!cfg) return 'All Statuses'
                  const StatusIcon = cfg.icon
                  return (
                    <span className="flex items-center gap-1.5 truncate">
                      <StatusIcon className="size-3 shrink-0" />
                      <span className="truncate">{cfg.label}</span>
                    </span>
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              {Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => {
                const StatusIcon = v.icon
                return (
                  <SelectItem key={k} value={k} className="text-xs capitalize">
                    <span className="flex items-center gap-1.5">
                      <StatusIcon className="size-3 shrink-0" />
                      <span>{v.label}</span>
                    </span>
                  </SelectItem>
                )
              })}
            </SelectPopup>
          </Select>

          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onValueChange={(val) => setPriorityFilter((val as string) || 'all')}
          >
            <SelectTrigger className="h-8 w-full sm:w-auto sm:min-w-[120px] bg-background text-xs font-medium capitalize px-2.5">
              <SelectValue placeholder="All Priorities">
                {(val) => {
                  if (val === 'all' || !val) return 'All Priorities'
                  const cfg = TASK_PRIORITY_CONFIG[val as TaskPriority]
                  if (!cfg) return 'All Priorities'
                  const PriorityIcon = cfg.icon
                  return (
                    <span className="flex items-center gap-1.5 truncate">
                      <PriorityIcon className="size-3 shrink-0" />
                      <span className="truncate">{cfg.label}</span>
                    </span>
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all" className="text-xs">All Priorities</SelectItem>
              {Object.entries(TASK_PRIORITY_CONFIG).map(([k, v]) => {
                const PriorityIcon = v.icon
                return (
                  <SelectItem key={k} value={k} className="text-xs capitalize">
                    <span className="flex items-center gap-1.5">
                      <PriorityIcon className="size-3 shrink-0" />
                      <span>{v.label}</span>
                    </span>
                  </SelectItem>
                )
              })}
            </SelectPopup>
          </Select>

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter((val as string) || 'all')}
          >
            <SelectTrigger className="h-8 w-full sm:w-auto sm:min-w-[115px] bg-background text-xs font-medium capitalize px-2.5">
              <SelectValue placeholder="All Types">
                {(val) => {
                  if (val === 'all' || !val) return 'All Types'
                  const cfg = TASK_TYPE_CONFIG[val as TaskType]
                  if (!cfg) return 'All Types'
                  const TypeIcon = cfg.icon
                  return (
                    <span className="flex items-center gap-1.5 truncate">
                      <TypeIcon className="size-3 shrink-0" />
                      <span className="truncate">{cfg.label}</span>
                    </span>
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all" className="text-xs">All Types</SelectItem>
              {Object.entries(TASK_TYPE_CONFIG).map(([k, v]) => {
                const TypeIcon = v.icon
                return (
                  <SelectItem key={k} value={k} className="text-xs capitalize">
                    <span className="flex items-center gap-1.5">
                      <TypeIcon className="size-3 shrink-0" />
                      <span>{v.label}</span>
                    </span>
                  </SelectItem>
                )
              })}
            </SelectPopup>
          </Select>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedTaskIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 backdrop-blur-md animate-in fade-in duration-150">
          <span className="text-xs font-semibold text-foreground">
            {selectedTaskIds.length} tasks selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleBatchStatus('in_progress')}
              className="text-xs h-7"
            >
              Set In Progress
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleBatchStatus('done')}
              className="text-xs h-7 text-emerald-600 dark:text-emerald-400"
            >
              Mark Done
            </Button>
            <Button
              size="xs"
              variant="destructive"
              onClick={handleBatchDelete}
              className="text-xs h-7 gap-1"
            >
              <Trash2 className="size-3" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Main View Mode */}
      {viewMode === 'table' ? (
        <TaskTableView
          tasks={filteredTasks}
          projects={projects}
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
              setSelectedTaskIds(filteredTasks.map((t: Task) => t.id))
            }
          }}
          onViewDetails={(t) => {
            setSelectedTaskForDetail(t)
            setIsDetailDrawerOpen(true)
          }}
          onEdit={(t) => {
            setSelectedTaskForEdit(t)
            setIsEditModalOpen(true)
          }}
          onDelete={(t) => {
            setTaskToDelete(t)
            setIsDeleteDialogOpen(true)
          }}
          onStatusChange={handleStatusChange}
          onOpenCreateModal={() => {
            setCreateTaskDefaultStatus('todo')
            setIsCreateModalOpen(true)
          }}
        />
      ) : (
        <TaskKanbanView
          tasks={filteredTasks}
          onViewDetails={(t) => {
            setSelectedTaskForDetail(t)
            setIsDetailDrawerOpen(true)
          }}
          onEdit={(t) => {
            setSelectedTaskForEdit(t)
            setIsEditModalOpen(true)
          }}
          onDelete={(t) => {
            setTaskToDelete(t)
            setIsDeleteDialogOpen(true)
          }}
          onStatusChange={handleStatusChange}
          onOpenCreateModalWithStatus={(st) => {
            setCreateTaskDefaultStatus(st)
            setIsCreateModalOpen(true)
          }}
        />
      )}

      {/* Task Create Modal */}
      <TaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        projects={projects}
        users={users}
        defaultStatus={createTaskDefaultStatus}
        onSubmit={handleCreateTask}
        isSubmitting={isSubmitting}
      />

      {/* Task Edit Modal */}
      <TaskModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        task={selectedTaskForEdit}
        projects={projects}
        users={users}
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
          setIsDeleteDialogOpen(true)
        }}
        onAddComment={handleAddComment}
      />

      {/* Delete Task Confirmation */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={taskToDelete?.title || 'this task'}
        onConfirm={handleDeleteTaskConfirm}
        isDeleting={isSubmitting}
      />
    </div>
  )
}
