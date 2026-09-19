import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useTransition, useMemo } from 'react'
import {
  getItemsFn,
  createItemFn,
  updateItemFn,
  deleteItemFn,
  duplicateItemFn,
  batchUpdateItemsFn,
  batchDeleteItemsFn,
  seedDemoDataFn,
} from '@/server/items'
import type { Item, ItemCategory, ItemPriority, ItemStatus } from '@/db/schema'
import { StatsOverview } from '@/components/dashboard/StatsOverview'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { ItemTableView } from '@/components/dashboard/ItemTableView'
import { ItemKanbanView } from '@/components/dashboard/ItemKanbanView'
import { ItemModal } from '@/components/dashboard/ItemModal'
import { ItemDetailDrawer } from '@/components/dashboard/ItemDetailDrawer'
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog'
import { BatchActionBar } from '@/components/dashboard/BatchActionBar'
import { SuccessCheckIcon } from '@/components/ui/transitions'
import type { FilterState, ViewMode } from '@/components/dashboard/types'
import { PRIORITY_CONFIG } from '@/components/dashboard/types'
import { AlertCircle } from 'lucide-react'

import { getProjectsFn } from '@/server/projects'
import { PROJECT_HEALTH_CONFIG, PROJECT_COLOR_MAP, PROJECT_ICONS } from '@/components/tasks/types'
import { Link } from '@tanstack/react-router'
import { Folder, ArrowRight } from 'lucide-react'
import type { ProjectHealth } from '@/db/schema'

export const Route = createFileRoute('/_authenticated/')({
  loader: async () => {
    const [items, projects] = await Promise.all([getItemsFn(), getProjectsFn()])
    return { items, projects }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { items, projects } = Route.useLoaderData()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  // Filtering & Pagination State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    sortBy: 'created_desc',
    page: 1,
    pageSize: 10,
  })

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Notification Toast State
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr))
    }, 4000)
  }

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<Item | null>(null)

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<Item | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [isBatchDelete, setIsBatchDelete] = useState(false)

  // Loading flags
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)

  // Filter Updates
  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      sortBy: 'created_desc',
      page: 1,
      pageSize: 10,
    })
  }

  // Filtered and Sorted Items Calculation
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items]

    // 1. Search Query
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim()
      result = result.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.assigneeName && i.assigneeName.toLowerCase().includes(q)) ||
          (i.tags && i.tags.toLowerCase().includes(q)),
      )
    }

    // 2. Status
    if (filters.status !== 'all') {
      result = result.filter((i) => i.status === filters.status)
    }

    // 3. Priority
    if (filters.priority !== 'all') {
      result = result.filter((i) => i.priority === filters.priority)
    }

    // 4. Category
    if (filters.category !== 'all') {
      result = result.filter((i) => i.category === filters.category)
    }

    // 5. Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'created_asc':
          return (a.createdAt || '').localeCompare(b.createdAt || '')
        case 'created_desc':
          return (b.createdAt || '').localeCompare(a.createdAt || '')
        case 'due_date_asc':
          return (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
        case 'priority_desc': {
          const weightA = PRIORITY_CONFIG[a.priority as ItemPriority]?.weight || 0
          const weightB = PRIORITY_CONFIG[b.priority as ItemPriority]?.weight || 0
          return weightB - weightA
        }
        case 'progress_desc':
          return (b.progress || 0) - (a.progress || 0)
        case 'budget_desc':
          return (b.budget || 0) - (a.budget || 0)
        default:
          return 0
      }
    })

    return result
  }, [items, filters])

  // Paginated Items for Table View
  const paginatedItems = useMemo(() => {
    const start = (filters.page - 1) * filters.pageSize
    return filteredAndSortedItems.slice(start, start + filters.pageSize)
  }, [filteredAndSortedItems, filters.page, filters.pageSize])

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleToggleSelectAll = () => {
    const currentPageIds = paginatedItems.map((i) => i.id)
    const isAllCurrentSelected = currentPageIds.every((id) => selectedIds.includes(id))
    if (isAllCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])))
    }
  }

  // Refresh
  const handleRefresh = () => {
    startTransition(() => {
      router.invalidate()
    })
    showToast('Data synced with database', 'info')
  }

  // Seed Demo Data
  const handleSeedData = async () => {
    setIsSeeding(true)
    try {
      const res = await seedDemoDataFn()
      startTransition(() => {
        router.invalidate()
      })
      showToast(`Successfully loaded ${res.count} demo initiatives!`, 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to seed demo data', 'error')
    } finally {
      setIsSeeding(false)
    }
  }

  // Create or Update Submission
  const handleCreateOrUpdateSubmit = async (data: {
    id?: string
    title: string
    description?: string
    status: ItemStatus
    priority: ItemPriority
    category: ItemCategory
    assigneeName: string
    assigneeAvatar: string
    dueDate: string
    progress: number
    budget: number
    tags: string
  }) => {
    setIsSubmitting(true)
    try {
      if (data.id) {
        await updateItemFn({ data: { ...data, id: data.id } })
        showToast('Initiative updated successfully', 'success')
      } else {
        const { id, ...createPayload } = data
        await createItemFn({ data: createPayload })
        showToast('New initiative created successfully', 'success')
      }
      startTransition(() => {
        router.invalidate()
      })
      setIsCreateModalOpen(false)
      setIsEditModalOpen(false)
      setSelectedItemForEdit(null)
    } catch (err: any) {
      showToast(err?.message || 'Failed to save initiative', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Active detail item derived from latest items list
  const activeDetailItem = useMemo(() => {
    if (!selectedItemForDetail) return null
    return items.find((i) => i.id === selectedItemForDetail.id) || selectedItemForDetail
  }, [items, selectedItemForDetail])

  // Direct Status Transition
  const handleStatusChange = async (id: string, newStatus: ItemStatus) => {
    // Optimistic update for immediate UI reflection in open drawer/modals
    setSelectedItemForDetail((prev) =>
      prev && prev.id === id ? { ...prev, status: newStatus } : prev,
    )
    try {
      await updateItemFn({
        data: {
          id,
          status: newStatus,
        },
      })
      startTransition(() => {
        router.invalidate()
      })
      showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'info')
    } catch (err: any) {
      showToast(err?.message || 'Failed to change status', 'error')
    }
  }

  // Direct Progress Change
  const handleProgressChange = async (id: string, progress: number) => {
    // Optimistic update for immediate slider feedback
    setSelectedItemForDetail((prev) =>
      prev && prev.id === id ? { ...prev, progress } : prev,
    )
    try {
      await updateItemFn({
        data: {
          id,
          progress,
        },
      })
      startTransition(() => {
        router.invalidate()
      })
    } catch (err: any) {
      showToast(err?.message || 'Failed to update progress', 'error')
    }
  }

  // Duplicate Item
  const handleDuplicate = async (id: string) => {
    try {
      await duplicateItemFn({ data: { id } })
      startTransition(() => {
        router.invalidate()
      })
      showToast('Initiative duplicated successfully', 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to duplicate initiative', 'error')
    }
  }

  // Single Delete Request
  const handleRequestDelete = (item: Item) => {
    setItemToDelete(item)
    setIsBatchDelete(false)
    setIsDeleteDialogOpen(true)
  }

  // Batch Delete Request
  const handleRequestBatchDelete = () => {
    if (selectedIds.length === 0) return
    setIsBatchDelete(true)
    setIsDeleteDialogOpen(true)
  }

  // Confirm Delete Execution
  const handleConfirmDelete = async () => {
    setIsSubmitting(true)
    try {
      if (isBatchDelete) {
        await batchDeleteItemsFn({ data: { ids: selectedIds } })
        showToast(`Deleted ${selectedIds.length} initiatives`, 'success')
        setSelectedIds([])
      } else if (itemToDelete) {
        await deleteItemFn({ data: { id: itemToDelete.id } })
        showToast('Initiative deleted', 'success')
        setSelectedIds((prev) => prev.filter((id) => id !== itemToDelete.id))
      }
      startTransition(() => {
        router.invalidate()
      })
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Batch Status Change
  const handleBatchStatusChange = async (status: ItemStatus) => {
    setIsProcessingBatch(true)
    try {
      await batchUpdateItemsFn({
        data: {
          ids: selectedIds,
          updates: { status },
        },
      })
      startTransition(() => {
        router.invalidate()
      })
      showToast(`Updated status for ${selectedIds.length} items`, 'success')
      setSelectedIds([])
    } catch (err: any) {
      showToast(err?.message || 'Failed batch status update', 'error')
    } finally {
      setIsProcessingBatch(false)
    }
  }

  // Batch Priority Change
  const handleBatchPriorityChange = async (priority: ItemPriority) => {
    setIsProcessingBatch(true)
    try {
      await batchUpdateItemsFn({
        data: {
          ids: selectedIds,
          updates: { priority },
        },
      })
      startTransition(() => {
        router.invalidate()
      })
      showToast(`Updated priority for ${selectedIds.length} items`, 'success')
      setSelectedIds([])
    } catch (err: any) {
      showToast(err?.message || 'Failed batch priority update', 'error')
    } finally {
      setIsProcessingBatch(false)
    }
  }

  // Quick detail modal view
  const handleViewDetails = (item: Item) => {
    setSelectedItemForDetail(item)
    setIsDetailDrawerOpen(true)
  }

  // Quick edit modal
  const handleEdit = (item: Item) => {
    setSelectedItemForEdit(item)
    setIsEditModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium shadow-xl backdrop-blur-lg animate-in slide-in-from-top-4 duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-500/90 text-white border-rose-600'
              : notification.type === 'info'
                ? 'bg-sky-600/90 text-white border-sky-700'
                : 'bg-emerald-600/90 text-white border-emerald-700'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="size-4" />
          ) : (
            <SuccessCheckIcon size={16} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <DashboardHeader
        itemCount={items.length}
        isSeeding={isSeeding}
        isRefreshing={isPending}
        onSeedData={handleSeedData}
        onRefresh={handleRefresh}
        onOpenCreateModal={() => {
          setSelectedItemForEdit(null)
          setIsCreateModalOpen(true)
        }}
      />

      {/* KPI Stats Overview */}
      <StatsOverview
        items={items}
        onQuickFilterStatus={(status) => {
          if (status === 'urgent') {
            setFilters((p) => ({ ...p, priority: 'urgent', status: 'all', page: 1 }))
          } else {
            setFilters((p) => ({ ...p, status, priority: 'all', page: 1 }))
          }
        }}
      />

      {/* Active Projects Hub Ribbon */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="size-4 text-primary" />
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Active Project Workspaces
            </h3>
          </div>
          <Link
            to="/projects"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            View All Projects ({projects.length}) <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.slice(0, 4).map((p) => {
            const healthCfg = PROJECT_HEALTH_CONFIG[p.health as ProjectHealth] || PROJECT_HEALTH_CONFIG.on_track
            const colorCfg = PROJECT_COLOR_MAP[p.color] || PROJECT_COLOR_MAP.sky
            const IconComp = PROJECT_ICONS[p.icon] || Folder

            return (
              <Link
                key={p.id}
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border/70 bg-card/85 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-[transform,border-color,box-shadow] duration-150 ease-out backdrop-blur-md cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex size-8 items-center justify-center rounded-lg ${colorCfg.bg} ${colorCfg.text} ${colorCfg.border} border`}>
                      <IconComp className="size-4" />
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${healthCfg.bg} ${healthCfg.color} ${healthCfg.border}`}>
                      <span className={`size-1.5 rounded-full ${healthCfg.dot}`} />
                      {healthCfg.label}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {p.description || 'No description'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-border/40 space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">{p.completedTasks}/{p.totalTasks} tasks</span>
                      <span className="font-bold text-foreground">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-muted/60 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:underline">
                      Open Board <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Filter and View Controls */}
      <DashboardFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={items.length}
        filteredCount={filteredAndSortedItems.length}
      />

      {/* Data Views: Table or Kanban */}
      {viewMode === 'table' ? (
        <ItemTableView
          items={paginatedItems}
          totalItems={filteredAndSortedItems.length}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleRequestDelete}
          onStatusChange={handleStatusChange}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => handleFilterChange({ page })}
          onPageSizeChange={(pageSize) => handleFilterChange({ pageSize, page: 1 })}
          onOpenCreateModal={() => {
            setSelectedItemForEdit(null)
            setIsCreateModalOpen(true)
          }}
        />
      ) : (
        <ItemKanbanView
          items={filteredAndSortedItems}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleRequestDelete}
          onStatusChange={handleStatusChange}
          onOpenCreateModalWithStatus={(status) => {
            setSelectedItemForEdit({
              id: '',
              title: '',
              description: '',
              status,
              priority: 'medium',
              category: 'engineering',
              assigneeName: 'Elena Rostova',
              assigneeAvatar: '',
              dueDate: '',
              progress: 0,
              budget: 5000,
              completed: false,
              tags: '[]',
              createdAt: '',
              updatedAt: '',
            })
            setIsCreateModalOpen(true)
          }}
        />
      )}

      {/* Floating Batch Action Bar */}
      <BatchActionBar
        selectedIds={selectedIds}
        items={items}
        onClearSelection={() => setSelectedIds([])}
        onBatchStatusChange={handleBatchStatusChange}
        onBatchPriorityChange={handleBatchPriorityChange}
        onBatchDelete={handleRequestBatchDelete}
        isProcessing={isProcessingBatch}
      />

      {/* Create Modal */}
      <ItemModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        item={null}
        onSubmit={handleCreateOrUpdateSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Edit Modal */}
      <ItemModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        item={selectedItemForEdit}
        onSubmit={handleCreateOrUpdateSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Detail Inspection Modal */}
      <ItemDetailDrawer
        open={isDetailDrawerOpen}
        onOpenChange={setIsDetailDrawerOpen}
        item={activeDetailItem}
        onEdit={(item) => {
          setSelectedItemForEdit(item)
          setIsEditModalOpen(true)
        }}
        onDuplicate={handleDuplicate}
        onDelete={handleRequestDelete}
        onStatusChange={handleStatusChange}
        onProgressChange={handleProgressChange}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        count={isBatchDelete ? selectedIds.length : 1}
        title={itemToDelete?.title}
        onConfirm={handleConfirmDelete}
        isDeleting={isSubmitting}
      />
    </div>
  )
}
