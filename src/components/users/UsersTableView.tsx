import type { SafeUser, UserRole, UserStatus } from '@/db/schema'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
  MenuGroup,
  MenuGroupLabel,
} from '@/components/ui/menu'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { USER_ROLE_CONFIG, USER_STATUS_CONFIG } from './types'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  KeyRound,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Mail,
} from 'lucide-react'

interface UsersTableViewProps {
  users: SafeUser[]
  totalUsers: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onEdit: (user: SafeUser) => void
  onDelete: (user: SafeUser) => void
  onToggleStatus: (id: string, status: UserStatus) => void
  onResetPassword: (user: SafeUser) => void
  currentUserId?: string
  isAdmin?: boolean
}

const STATUS_SELECT_OPTIONS: { label: string; value: UserStatus; dot: string }[] = [
  { label: 'Active', value: 'active', dot: 'bg-emerald-500' },
  { label: 'Inactive', value: 'inactive', dot: 'bg-amber-500' },
  { label: 'Suspended', value: 'suspended', dot: 'bg-rose-500' },
]

export function UsersTableView({
  users,
  totalUsers,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword,
  currentUserId,
  isAdmin = false,
}: UsersTableViewProps) {
  const totalPages = Math.ceil(totalUsers / pageSize) || 1

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-md backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">User</th>
              <th className="py-3.5 px-3 font-semibold">Role</th>
              <th className="py-3.5 px-3 font-semibold">Status</th>
              <th className="py-3.5 px-3 font-semibold hidden md:table-cell">Department & Title</th>
              <th className="py-3.5 px-3 font-semibold hidden lg:table-cell">Last Active</th>
              <th className="py-3.5 px-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-medium">No users match your criteria</p>
                    <p className="text-xs text-muted-foreground/70">
                      Try adjusting your search query or role/status filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const roleCfg = USER_ROLE_CONFIG[user.role as UserRole] || USER_ROLE_CONFIG.member
                const statusCfg = USER_STATUS_CONFIG[user.status as UserStatus] || USER_STATUS_CONFIG.active
                const isCurrentUser = user.id === currentUserId
                const initials = user.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                  : 'U'

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 ring-1 ring-border shrink-0">
                          <AvatarImage src={user.avatar || undefined} alt={user.name} />
                          <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {user.name}
                            </span>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono text-primary border-primary/30">
                                YOU
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="size-3 shrink-0" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleCfg.bg} ${roleCfg.color} ${roleCfg.border}`}
                      >
                        {roleCfg.label}
                      </span>
                    </td>

                    {/* Status Select */}
                    <td className="py-3 px-3">
                      <Select
                        value={user.status}
                        onValueChange={(val) => val && onToggleStatus(user.id, val as UserStatus)}
                      >
                        <SelectTrigger
                          aria-label={`Change status for ${user.name}`}
                          className={`h-7 w-fit min-w-28 px-2 text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
                        >
                          <SelectValue>
                            {(val) => {
                              const cfg = USER_STATUS_CONFIG[val as UserStatus] || statusCfg
                              return (
                                <span className="flex items-center gap-1.5 truncate">
                                  <span className={`size-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
                                  <span className="truncate">{cfg.label}</span>
                                </span>
                              )
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectPopup>
                          {STATUS_SELECT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              <span className="flex items-center gap-1.5">
                                <span className={`size-1.5 rounded-full ${opt.dot}`} aria-hidden="true" />
                                <span>{opt.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectPopup>
                      </Select>
                    </td>

                    {/* Department & Title */}
                    <td className="py-3 px-3 hidden md:table-cell">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.department || 'General'}</span>
                        <span className="text-[11px] text-muted-foreground">{user.title || 'Team Member'}</span>
                      </div>
                    </td>

                    {/* Last active / Created */}
                    <td className="py-3 px-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {user.lastLoginAt ? (
                        <span>{new Date(user.lastLoginAt).toLocaleDateString()}</span>
                      ) : (
                        <span className="italic text-muted-foreground/60">Never</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      {isAdmin ? (
                        <Menu>
                          <MenuTrigger className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer">
                            <MoreHorizontal className="size-4" />
                          </MenuTrigger>
                          <MenuPopup align="end" className="w-48">
                            <MenuGroup>
                              <MenuGroupLabel>User Actions</MenuGroupLabel>
                              <MenuItem onClick={() => onEdit(user)} className="gap-2 text-xs">
                                <Edit className="size-3.5" />
                                Edit Profile
                              </MenuItem>
                              <MenuItem onClick={() => onResetPassword(user)} className="gap-2 text-xs">
                                <KeyRound className="size-3.5" />
                                Reset Password
                              </MenuItem>
                            </MenuGroup>
                            <MenuSeparator />
                            <MenuGroup>
                              <MenuGroupLabel>Status Change</MenuGroupLabel>
                              {user.status !== 'active' && (
                                <MenuItem
                                  onClick={() => onToggleStatus(user.id, 'active')}
                                  className="gap-2 text-xs text-emerald-600"
                                >
                                  <UserCheck className="size-3.5" />
                                  Set Active
                                </MenuItem>
                              )}
                              {user.status !== 'inactive' && (
                                <MenuItem
                                  onClick={() => onToggleStatus(user.id, 'inactive')}
                                  className="gap-2 text-xs text-amber-600"
                                >
                                  <UserX className="size-3.5" />
                                  Set Inactive
                                </MenuItem>
                              )}
                              {user.status !== 'suspended' && (
                                <MenuItem
                                  onClick={() => onToggleStatus(user.id, 'suspended')}
                                  className="gap-2 text-xs text-rose-600"
                                >
                                  <UserX className="size-3.5" />
                                  Suspend Account
                                </MenuItem>
                              )}
                            </MenuGroup>
                            {!isCurrentUser && (
                              <>
                                <MenuSeparator />
                                <MenuItem
                                  onClick={() => onDelete(user)}
                                  className="gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                                >
                                  <Trash2 className="size-3.5" />
                                  Delete User
                                </MenuItem>
                              </>
                            )}
                          </MenuPopup>
                        </Menu>
                      ) : isCurrentUser ? (
                        <button
                          type="button"
                          onClick={() => onEdit(user)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          <Edit className="size-3" /> Edit
                        </button>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs px-2">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalUsers > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => val && onPageSizeChange(Number(val))}
            >
              <SelectTrigger aria-label="Rows per page" className="h-7 w-fit min-w-16 px-2 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Page <strong className="text-foreground">{page}</strong> of{' '}
              <strong className="text-foreground">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="size-7"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="size-7"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
