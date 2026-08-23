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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SafeUser, UserRole, UserStatus } from '@/db/schema'
import { useShakeError } from '@/components/ui/transitions'
import { USER_AVATAR_PRESETS } from './types'
import { User as UserIcon, Mail, Shield, Lock, Briefcase, Building2, Image, Check } from 'lucide-react'

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: SafeUser | null
  canChangeRole?: boolean
  canChangeStatus?: boolean
  onSubmit: (data: {
    id?: string
    name: string
    email: string
    password?: string
    role: UserRole
    status: UserStatus
    department: string
    title: string
    avatar: string
  }) => Promise<void>
}

const ROLE_OPTIONS: { label: string; value: UserRole; dot: string }[] = [
  { label: 'Administrator', value: 'admin', dot: 'bg-purple-500' },
  { label: 'Manager', value: 'manager', dot: 'bg-blue-500' },
  { label: 'Member', value: 'member', dot: 'bg-teal-500' },
  { label: 'Guest', value: 'guest', dot: 'bg-slate-500' },
]

const STATUS_OPTIONS: { label: string; value: UserStatus; dot: string }[] = [
  { label: 'Active', value: 'active', dot: 'bg-emerald-500' },
  { label: 'Inactive', value: 'inactive', dot: 'bg-amber-500' },
  { label: 'Suspended', value: 'suspended', dot: 'bg-rose-500' },
]

const DEPARTMENT_PRESETS = [
  'Engineering',
  'Design',
  'Marketing',
  'Operations',
  'Finance',
  'Product',
  'Customer Success',
]

export function UserModal({
  open,
  onOpenChange,
  user,
  canChangeRole = false,
  canChangeStatus = false,
  onSubmit,
}: UserModalProps) {
  const isEditing = !!user

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('member')
  const [status, setStatus] = useState<UserStatus>('active')
  const [department, setDepartment] = useState('Engineering')
  const [title, setTitle] = useState('')
  const [avatar, setAvatar] = useState(USER_AVATAR_PRESETS[0].avatar)

  const shake = useShakeError(3500)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPassword('')
      setRole((user.role as UserRole) || 'member')
      setStatus((user.status as UserStatus) || 'active')
      setDepartment(user.department || 'Engineering')
      setTitle(user.title || '')
      setAvatar(user.avatar || USER_AVATAR_PRESETS[0].avatar)
    } else {
      setName('')
      setEmail('')
      setPassword('')
      setRole('member')
      setStatus('active')
      setDepartment('Engineering')
      setTitle('')
      setAvatar(USER_AVATAR_PRESETS[0].avatar)
    }
    shake.clearError()
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    shake.clearError()

    if (!name.trim()) {
      shake.triggerError('Name is required')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      shake.triggerError('Valid email address is required')
      return
    }

    if (!isEditing && (!password || password.length < 6)) {
      shake.triggerError('Password must be at least 6 characters')
      return
    }

    if (isEditing && password && password.length < 6) {
      shake.triggerError('New password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        id: user?.id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password || undefined,
        role,
        status,
        department: department.trim() || 'General',
        title: title.trim() || 'Team Member',
        avatar,
      })
      onOpenChange(false)
    } catch (err: any) {
      shake.triggerError(err?.message || 'Failed to save user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className={`max-w-lg ${shake.isShaking ? 'is-shaking' : ''}`}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {isEditing ? `Edit Team Member: ${user?.name}` : 'Add New Team Member'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing
              ? 'Update workspace role, department, credentials, and profile attributes.'
              : 'Add a new collaborator to your workspace directory and assign initial access roles.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <DialogPanel className="space-y-4">
            {shake.errorText && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {shake.errorText}
              </div>
            )}

            {/* Avatar Picker Strip */}
            <div>
              <label className="block text-xs font-medium text-foreground/90 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Image className="size-3.5 text-muted-foreground" />
                  Choose Profile Avatar
                </span>
                <span className="text-[10px] text-muted-foreground">Select style</span>
              </label>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 px-0.5">
                {USER_AVATAR_PRESETS.map((preset) => {
                  const isSelected = avatar === preset.avatar
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setAvatar(preset.avatar)}
                      className={`relative flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 bg-primary/5'
                          : 'opacity-70 hover:opacity-100 hover:bg-muted/50'
                      }`}
                    >
                      <Avatar className="size-10 border border-border/80">
                        <AvatarImage src={preset.avatar} alt={preset.name} />
                        <AvatarFallback>{preset.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[52px]">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-foreground/90 mb-1.5 flex items-center gap-1.5">
                  <UserIcon className="size-3.5 text-muted-foreground" />
                  Full Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="bg-background text-xs h-9"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/90 mb-1.5 flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground" />
                  Email Address <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="bg-background text-xs h-9"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-foreground/90 mb-1.5 flex items-center gap-1.5">
                <Lock className="size-3.5 text-muted-foreground" />
                {isEditing ? 'New Password (optional)' : 'Password'} {!isEditing && <span className="text-destructive">*</span>}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? 'Leave blank to keep current' : 'Min 6 characters'}
                className="bg-background text-xs h-9"
              />
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-foreground/90 flex items-center gap-1.5">
                    <Shield className="size-3.5 text-muted-foreground" />
                    Workspace Role
                  </label>
                  {!canChangeRole && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                      <Lock className="size-2.5" /> Admin only
                    </span>
                  )}
                </div>
                <Select
                  value={role}
                  onValueChange={(val) => val && canChangeRole && setRole(val as UserRole)}
                  disabled={!canChangeRole}
                >
                  <SelectTrigger
                    aria-label="Select role"
                    className={`w-full h-9 bg-background px-3 text-xs font-medium ${!canChangeRole ? 'opacity-65 cursor-not-allowed bg-muted/30' : ''}`}
                  >
                    <SelectValue placeholder="Select role">
                      {(val) => {
                        const item = ROLE_OPTIONS.find((r) => r.value === val) || ROLE_OPTIONS[0]
                        return (
                          <span className="flex items-center gap-2 truncate">
                            <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                            <span className="truncate">{item.label}</span>
                          </span>
                        )
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {ROLE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="text-xs">
                        <span className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                          <span>{item.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-foreground/90 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                    Account Status
                  </label>
                  {!canChangeStatus && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                      <Lock className="size-2.5" /> Admin only
                    </span>
                  )}
                </div>
                <Select
                  value={status}
                  onValueChange={(val) => val && canChangeStatus && setStatus(val as UserStatus)}
                  disabled={!canChangeStatus}
                >
                  <SelectTrigger
                    aria-label="Select status"
                    className={`w-full h-9 bg-background px-3 text-xs font-medium ${!canChangeStatus ? 'opacity-65 cursor-not-allowed bg-muted/30' : ''}`}
                  >
                    <SelectValue placeholder="Select status">
                      {(val) => {
                        const item = STATUS_OPTIONS.find((s) => s.value === val) || STATUS_OPTIONS[0]
                        return (
                          <span className="flex items-center gap-2 truncate">
                            <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                            <span className="truncate">{item.label}</span>
                          </span>
                        )
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="text-xs">
                        <span className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                          <span>{item.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
            </div>

            {/* Department & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-foreground/90 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-muted-foreground" />
                  Department
                </label>
                <Select
                  value={department}
                  onValueChange={(val) => val && setDepartment(val as string)}
                >
                  <SelectTrigger aria-label="Select department" className="w-full h-9 bg-background px-3 text-xs font-medium">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectPopup>
                    {DEPARTMENT_PRESETS.map((dept) => (
                      <SelectItem key={dept} value={dept} className="text-xs">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/90 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="size-3.5 text-muted-foreground" />
                  Job Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="bg-background text-xs h-9"
                />
              </div>
            </div>

            {/* Avatar Picker with Interactive Thumbnails */}
            <div>
              <label className="block text-xs font-medium text-foreground/90 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Image className="size-3.5 text-muted-foreground" />
                  Profile Avatar
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {USER_AVATAR_PRESETS.find((p) => p.avatar === avatar)?.name || 'Custom'}
                </span>
              </label>
              
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-muted/20 overflow-x-auto">
                {USER_AVATAR_PRESETS.map((preset) => {
                  const isSelected = avatar === preset.avatar
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setAvatar(preset.avatar)}
                      className={`relative rounded-full transition-all cursor-pointer p-0.5 ${
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-xs'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      title={preset.name}
                    >
                      <Avatar className="size-8 border border-border/60">
                        <AvatarImage src={preset.avatar} alt={preset.name} />
                        <AvatarFallback className="text-[10px]">
                          {preset.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {isSelected && (
                        <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                          <Check className="size-2.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </DialogPanel>

          <DialogFooter className="mt-2">
            <DialogClose render={<Button variant="outline" size="sm" type="button" disabled={isSubmitting} className="cursor-pointer" />}>
              Cancel
            </DialogClose>
            <Button size="sm" type="submit" disabled={isSubmitting} className="gap-1.5 shadow-xs font-semibold cursor-pointer">
              {isSubmitting && <Spinner className="size-3.5" />}
              {isEditing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}

