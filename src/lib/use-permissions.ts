import { useAuth } from './auth-context'
import type { UserRole } from '@/db/schema'

export function usePermissions() {
  const { user, token, isAuthenticated, isLoading, refetchUser } = useAuth()
  const role = (user?.role || 'guest') as UserRole

  const isAdmin = role === 'admin'
  const isManager = role === 'manager' || isAdmin
  const isMember = role === 'member' || isManager
  const isGuest = role === 'guest'

  return {
    user,
    token,
    role,
    isAuthenticated,
    isLoading,
    refetchUser,
    isAdmin,
    isManager,
    isMember,
    isGuest,

    // Specific capability flags
    canCreateUser: isAdmin,
    canChangeUserRole: isAdmin,
    canChangeUserStatus: isAdmin,
    canDeleteUser: isAdmin,
    canResetPassword: isAdmin,

    canCreateProject: isManager,
    canEditProject: isManager,
    canDeleteProject: isAdmin,
    canResetWorkspaceData: isAdmin,

    canCreateTask: isMember,
    canEditTask: isMember,
    canDeleteTask: isManager,
    canBatchUpdateTasks: isManager,
  }
}
