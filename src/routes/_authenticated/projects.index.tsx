import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useTransition, useMemo } from 'react'
import { getProjectsFn, createProjectFn, updateProjectFn, deleteProjectFn, type ProjectWithStats } from '@/server/projects'
import { getUsersFn } from '@/server/users'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectModal } from '@/components/projects/ProjectModal'
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog'
import { AnimatedDigitGroup, SuccessCheckIcon } from '@/components/ui/transitions'
import { exportProjectsToCsv } from '@/lib/export-utils'
import { usePermissions } from '@/lib/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Folder,
  Plus,
  Search,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Download,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/projects/')({
  loader: async () => {
    const [projects, users] = await Promise.all([getProjectsFn(), getUsersFn()])
    return { projects, users }
  },
  component: ProjectsPage,
})

function ProjectsPage() {
  const { projects, users } = Route.useLoaderData()
  const router = useRouter()
  const { isAdmin, canCreateProject, token } = usePermissions()
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState('')
  const [healthFilter, setHealthFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<ProjectWithStats | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithStats | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const match = p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
        if (!match) return false
      }
      if (healthFilter !== 'all' && p.health !== healthFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      return true
    })
  }, [projects, search, healthFilter, statusFilter])

  // Aggregate stats
  const totalProjects = projects.length
  const activeProjects = projects.filter((p) => p.status === 'active').length
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0)
  const atRiskCount = projects.filter((p) => p.health === 'at_risk' || p.health === 'off_track').length

  const handleCreateOrUpdateSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      if (data.id) {
        await updateProjectFn({ data })
        showToast('Project updated successfully', 'success')
      } else {
        await createProjectFn({ data })
        showToast('New project created successfully', 'success')
      }
      startTransition(() => {
        router.invalidate()
      })
      setIsCreateModalOpen(false)
      setIsEditModalOpen(false)
      setSelectedProjectForEdit(null)
    } catch (err: any) {
      showToast(err?.message || 'Failed to save project', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return
    setIsSubmitting(true)
    try {
      await deleteProjectFn({ data: { id: projectToDelete.id, token: token || undefined } })
      startTransition(() => {
        router.invalidate()
      })
      showToast('Project deleted successfully', 'info')
      setIsDeleteDialogOpen(false)
      setProjectToDelete(null)
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete project', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            <Folder className="size-5 text-primary" />
            Projects Hub
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage product roadmaps, milestones, capacity allocations, and track multi-sprint progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              exportProjectsToCsv(filteredProjects)
              showToast('Exported projects roadmap to CSV', 'success')
            }}
            className="gap-1.5 shadow-2xs font-semibold h-9 text-xs cursor-pointer"
          >
            <Download className="size-3.5 text-muted-foreground" /> Export CSV
          </Button>

          {canCreateProject && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2 shadow-sm font-semibold h-9 text-xs cursor-pointer"
            >
              <Plus className="size-4" /> Create Project
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Projects
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Folder className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedDigitGroup value={totalProjects} />
            </span>
            <span className="text-xs text-muted-foreground">{activeProjects} active tracks</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Portfolio Budget
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedDigitGroup value={`$${totalBudget.toLocaleString()}`} />
            </span>
            <span className="text-xs text-muted-foreground">allocated</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Sprints
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedDigitGroup value={activeProjects} />
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">on track</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Project Health
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedDigitGroup value={atRiskCount} />
            </span>
            <span className={`text-xs font-medium ${atRiskCount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
              {atRiskCount > 0 ? 'requires lead review' : 'all nominal'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl border border-border/70 bg-card/85 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, key, or scope..."
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Health Filter */}
          <Select
            value={healthFilter}
            onValueChange={(val) => setHealthFilter((val as string) || 'all')}
          >
            <SelectTrigger className="h-9 min-w-32 bg-background text-xs font-medium">
              <SelectValue placeholder="All Health">
                {(val) => {
                  if (val === 'all' || !val) return 'All Health'
                  if (val === 'on_track') return '🟢 On Track'
                  if (val === 'at_risk') return '🟡 At Risk'
                  return '🔴 Off Track'
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all" className="text-xs">All Health</SelectItem>
              <SelectItem value="on_track" className="text-xs">🟢 On Track</SelectItem>
              <SelectItem value="at_risk" className="text-xs">🟡 At Risk</SelectItem>
              <SelectItem value="off_track" className="text-xs">🔴 Off Track</SelectItem>
            </SelectPopup>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter((val as string) || 'all')}
          >
            <SelectTrigger className="h-9 min-w-32 bg-background text-xs font-medium capitalize">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="active" className="text-xs">Active</SelectItem>
              <SelectItem value="planning" className="text-xs">Planning</SelectItem>
              <SelectItem value="paused" className="text-xs">Paused</SelectItem>
              <SelectItem value="completed" className="text-xs">Completed</SelectItem>
            </SelectPopup>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-2xl border border-dashed border-border/70 p-8">
            <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Folder className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground">No projects match your filters</h4>
                <p className="text-xs text-muted-foreground">
                  Try clearing your search query or create a new project.
                </p>
              </div>
              <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="mt-2 text-xs gap-1.5 cursor-pointer">
                <Plus className="size-3.5" /> Create Project
              </Button>
            </div>
          </div>
        ) : (
          filteredProjects.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              isAdmin={isAdmin}
              onEdit={(p) => {
                setSelectedProjectForEdit(p)
                setIsEditModalOpen(true)
              }}
              onDelete={(p) => {
                setProjectToDelete(p)
                setIsDeleteDialogOpen(true)
              }}
            />
          ))
        )}
      </div>

      {/* Create Modal */}
      <ProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        users={users}
        onSubmit={handleCreateOrUpdateSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Edit Modal */}
      <ProjectModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        project={selectedProjectForEdit}
        users={users}
        onSubmit={handleCreateOrUpdateSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={projectToDelete?.name || 'this project'}
        onConfirm={handleDeleteConfirm}
        isDeleting={isSubmitting}
      />
    </div>
  )
}
