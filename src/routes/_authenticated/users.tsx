import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useTransition, useMemo } from 'react'
import {
  getUsersFn,
  createUserFn,
  updateUserFn,
  deleteUserFn,
  toggleUserStatusFn,
  resetUserPasswordFn,
} from '@/server/users'
import type { SafeUser, UserStatus } from '@/db/schema'
import { usePermissions } from '@/lib/use-permissions'
import { UsersStatsOverview } from '@/components/users/UsersStatsOverview'
import { UsersFilters } from '@/components/users/UsersFilters'
import { UsersTableView } from '@/components/users/UsersTableView'
import { UserModal } from '@/components/users/UserModal'
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog'
import { Button } from '@/components/ui/button'
import { SuccessCheckIcon } from '@/components/ui/transitions'
import type { UserFilterState } from '@/components/users/types'
import {
  Users as UsersIcon,
  UserPlus,
  AlertCircle,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/users')({
  loader: () => getUsersFn(),
  component: UsersPage,
})

function UsersPage() {
  const users = Route.useLoaderData()
  const router = useRouter()
  const { user: currentUser, token, isAdmin } = usePermissions()
  const [, startTransition] = useTransition()

  // Filter state
  const [filters, setFilters] = useState<UserFilterState>({
    search: '',
    role: 'all',
    status: 'all',
    sortBy: 'name_asc',
    page: 1,
    pageSize: 10,
  })

  // Toast Notification
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
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<SafeUser | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<SafeUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase()
        const matchName = u.name.toLowerCase().includes(q)
        const matchEmail = u.email.toLowerCase().includes(q)
        const matchDept = u.department?.toLowerCase().includes(q)
        const matchTitle = u.title?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchDept && !matchTitle) return false
      }
      // Role
      if (filters.role !== 'all' && u.role !== filters.role) return false
      // Status
      if (filters.status !== 'all' && u.status !== filters.status) return false
      return true
    })
  }, [users, filters.search, filters.role, filters.status])

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers]
    switch (filters.sortBy) {
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name))
      case 'name_desc':
        return list.sort((a, b) => b.name.localeCompare(a.name))
      case 'created_asc':
        return list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
      case 'created_desc':
      default:
        return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    }
  }, [filteredUsers, filters.sortBy])

  // Pagination
  const paginatedUsers = useMemo(() => {
    const start = (filters.page - 1) * filters.pageSize
    return sortedUsers.slice(start, start + filters.pageSize)
  }, [sortedUsers, filters.page, filters.pageSize])

  // Handlers
  const handleFilterChange = (updates: Partial<UserFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      role: 'all',
      status: 'all',
      sortBy: 'name_asc',
      page: 1,
      pageSize: 10,
    })
  }

  const handleCreateUser = async (data: any) => {
    try {
      await createUserFn({ data: { ...data, token: token || undefined } })
      startTransition(() => {
        router.invalidate()
      })
      showToast(`Created user account for ${data.name}`)
    } catch (err: any) {
      showToast(err?.message || 'Failed to create user', 'error')
      throw err
    }
  }

  const handleUpdateUser = async (data: any) => {
    try {
      await updateUserFn({ data: { ...data, token: token || undefined } })
      startTransition(() => {
        router.invalidate()
      })
      showToast(`Updated profile for ${data.name}`)
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user', 'error')
      throw err
    }
  }

  const handleToggleStatus = async (id: string, status: UserStatus) => {
    const targetUser = users.find((u) => u.id === id)
    try {
      await toggleUserStatusFn({ data: { id, status, token: token || undefined } })
      startTransition(() => {
        router.invalidate()
      })
      showToast(`Set ${targetUser?.name || 'user'} to ${status}`)
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status', 'error')
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      await deleteUserFn({ data: { id: userToDelete.id, token: token || undefined } })
      startTransition(() => {
        router.invalidate()
      })
      showToast(`Deleted ${userToDelete.name} from workspace`)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete user', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResetPassword = async (user: SafeUser) => {
    const newPass = prompt(`Enter new password for ${user.name} (min 6 characters):`, 'password123')
    if (!newPass) return
    if (newPass.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }

    try {
      await resetUserPasswordFn({ data: { id: user.id, newPassword: newPass, token: token || undefined } })
      showToast(`Password for ${user.name} has been reset successfully`)
    } catch (err: any) {
      showToast(err?.message || 'Failed to reset password', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 rounded-2xl border p-3.5 shadow-2xl text-xs font-medium backdrop-blur-xl ${
              notification.type === 'error'
                ? 'border-destructive/40 bg-destructive/15 text-destructive'
                : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="size-4" />
            ) : (
              <SuccessCheckIcon size={16} />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UsersIcon className="size-5 text-primary" />
            Team & User Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage team member roles, permissions, directory profiles, and authentication credentials.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
            >
              <UserPlus className="size-4" />
              Add Member
            </Button>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <UsersStatsOverview users={users} />

      {/* Search & Filter Toolbar */}
      <UsersFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalCount={users.length}
        filteredCount={sortedUsers.length}
      />

      {/* User Table */}
      <UsersTableView
        users={paginatedUsers}
        totalUsers={sortedUsers.length}
        page={filters.page}
        pageSize={filters.pageSize}
        onPageChange={(page) => handleFilterChange({ page })}
        onPageSizeChange={(pageSize) => handleFilterChange({ pageSize, page: 1 })}
        onEdit={(user) => {
          setSelectedUserForEdit(user)
          setIsEditModalOpen(true)
        }}
        onDelete={(user) => {
          setUserToDelete(user)
          setIsDeleteDialogOpen(true)
        }}
        onToggleStatus={handleToggleStatus}
        onResetPassword={handleResetPassword}
        currentUserId={currentUser?.id}
        isAdmin={isAdmin}
      />

      {/* Create User Modal */}
      <UserModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        canChangeRole={isAdmin}
        canChangeStatus={isAdmin}
        onSubmit={handleCreateUser}
      />

      {/* Edit User Modal */}
      <UserModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        user={selectedUserForEdit}
        canChangeRole={isAdmin}
        canChangeStatus={isAdmin}
        onSubmit={handleUpdateUser}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={userToDelete}
        onConfirm={handleDeleteUser}
        isDeleting={isDeleting}
      />
    </div>
  )
}
