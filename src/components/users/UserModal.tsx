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
import { User as UserIcon, Mail, Shield, Lock, Briefcase, Building2, Image } from 'lucide-react'

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: SafeUser | null
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

export function UserModal({ open, onOpenChange, user, onSubmit }: UserModalProps) {
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
      setName(user.name)
      setEmail(user.email)
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
      shake.triggerError('Please enter user full name')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      shake.triggerError('Please enter a valid email address')
      return
    }

    if (!isEditing && (!password || password.length < 6)) {
      shake.triggerError('Password must be at least 6 characters long')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        id: user?.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password || undefined,
        role,
        status,
        department: department.trim(),
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
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {isEditing ? 'Edit Team Member' : 'Add New Team Member'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEditing
                  ? 'Update user account permissions, role, and profile.'
                  : 'Invite a new collaborator to the portfolio workspace.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogPanel className="space-y-4 py-3">
            <div className={`t-input-wrap ${shake.isError ? 'is-error' : ''}`}>
              {shake.errorText && (
                <div className="t-error-msg rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {shake.errorText}
                </div>
              )}
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <UserIcon className="size-3.5" />
                  Full Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="bg-background text-sm h-9"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Mail className="size-3.5" />
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="bg-background text-sm h-9"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Lock className="size-3.5" />
                {isEditing ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? '••••••••' : 'Min 6 characters'}
                className="bg-background text-sm h-9"
                required={!isEditing}
              />
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Shield className="size-3.5" />
                  Role
                </label>
                <Select
                  value={role}
                  onValueChange={(val) => val && setRole(val as UserRole)}
                >
                  <SelectTrigger aria-label="Select role" className="w-full h-9 bg-background px-2.5 text-xs font-medium">
                    <SelectValue placeholder="Select role">
                      {(val) => {
                        const item = ROLE_OPTIONS.find((r) => r.value === val) || ROLE_OPTIONS[0]
                        return (
                          <span className="flex items-center gap-1.5 truncate">
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
                        <span className="flex items-center gap-1.5">
                          <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                          <span>{item.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Account Status
                </label>
                <Select
                  value={status}
                  onValueChange={(val) => val && setStatus(val as UserStatus)}
                >
                  <SelectTrigger aria-label="Select status" className="w-full h-9 bg-background px-2.5 text-xs font-medium">
                    <SelectValue placeholder="Select status">
                      {(val) => {
                        const item = STATUS_OPTIONS.find((s) => s.value === val) || STATUS_OPTIONS[0]
                        return (
                          <span className="flex items-center gap-1.5 truncate">
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
                        <span className="flex items-center gap-1.5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  Department
                </label>
                <Select
                  value={department}
                  onValueChange={(val) => val && setDepartment(val as string)}
                >
                  <SelectTrigger aria-label="Select department" className="w-full h-9 bg-background px-2.5 text-xs font-medium">
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Briefcase className="size-3.5" />
                  Job Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="bg-background text-sm h-9"
                />
              </div>
            </div>

            {/* Avatar Preset Picker (p-select-20 pattern) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Image className="size-3.5" />
                Profile Photo Avatar
              </label>
              <Select
                value={avatar}
                onValueChange={(val) => val && setAvatar(val as string)}
              >
                <SelectTrigger aria-label="Select avatar photo" className="w-full h-9 bg-background px-2 text-xs">
                  <SelectValue placeholder="Select avatar">
                    {(val) => {
                      const preset = USER_AVATAR_PRESETS.find((p) => p.avatar === val) || USER_AVATAR_PRESETS[0]
                      return (
                        <span className="flex items-center gap-2 truncate">
                          <Avatar className="size-5">
                            <AvatarImage src={preset.avatar} alt={preset.name} />
                            <AvatarFallback className="text-[9px]">U</AvatarFallback>
                          </Avatar>
                          <span className="truncate font-medium">{preset.name} Style</span>
                        </span>
                      )
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  {USER_AVATAR_PRESETS.map((preset) => (
                    <SelectItem key={preset.name} value={preset.avatar} className="py-1.5 text-xs">
                      <span className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={preset.avatar} alt={preset.name} />
                          <AvatarFallback className="text-[10px]">U</AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">{preset.name} Preset</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
          </DialogPanel>

          <DialogFooter className="border-t border-border/50 pt-3">
            <DialogClose render={<Button variant="outline" size="sm" type="button" disabled={isSubmitting} />}>
              Cancel
            </DialogClose>
            <Button size="sm" type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Spinner className="size-3.5" />}
              {isEditing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
