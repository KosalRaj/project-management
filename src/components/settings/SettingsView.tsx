import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { updateUserFn, resetUserPasswordFn } from '@/server/users'
import {
  User as UserIcon,
  Lock,
  Mail,
  Building2,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Laptop,
} from 'lucide-react'

export function SettingsView() {
  const { user, refetchUser } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [title, setTitle] = useState(user?.title || '')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSavingProfile(true)
    setProfileMsg(null)
    try {
      await updateUserFn({
        data: {
          id: user.id,
          name: name.trim(),
          department: department.trim(),
          title: title.trim(),
        },
      })
      await refetchUser()
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err?.message || 'Failed to update profile' })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setPasswordMsg(null)

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setIsChangingPassword(true)
    try {
      await resetUserPasswordFn({
        data: {
          id: user.id,
          newPassword,
        },
      })
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' })
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err?.message || 'Failed to change password' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <UserIcon className="size-5 text-primary" />
          Account & Workspace Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your personal details, role credentials, and security preferences.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl border border-border/70 bg-card/85 p-6 shadow-xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-border/50 pb-5">
          <Avatar className="size-16 ring-2 ring-primary/20">
            <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'User'} />
            <AvatarFallback className="text-lg font-bold">
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground truncate">{user?.name}</h2>
              <Badge variant="outline" className="text-xs capitalize font-medium">
                {user?.role || 'member'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.title} • {user?.department}
            </p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Profile Information</h3>

          {profileMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
            >
              {profileMsg.type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
              {profileMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <UserIcon className="size-3.5" />
                Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background text-sm h-9"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Mail className="size-3.5" />
                Email Address
              </label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-muted text-sm h-9 cursor-not-allowed opacity-75"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Building2 className="size-3.5" />
                Department
              </label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-background text-sm h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Briefcase className="size-3.5" />
                Job Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background text-sm h-9"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" type="submit" disabled={isSavingProfile} className="gap-1.5">
              {isSavingProfile && <Spinner className="size-3.5" />}
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      {/* Password & Security Card */}
      <div className="rounded-2xl border border-border/70 bg-card/85 p-6 shadow-xs backdrop-blur-md space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <KeyRound className="size-4 text-primary" />
            Password & Security
          </h3>
          <p className="text-xs text-muted-foreground">Update your authentication password</p>
        </div>

        {passwordMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              passwordMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {passwordMsg.type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Lock className="size-3.5" />
                New Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="bg-background text-sm h-9"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Lock className="size-3.5" />
                Confirm Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="bg-background text-sm h-9"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" type="submit" disabled={isChangingPassword} className="gap-1.5">
              {isChangingPassword && <Spinner className="size-3.5" />}
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* System & Architecture Info */}
      <div className="rounded-2xl border border-border/70 bg-card/85 p-6 shadow-xs backdrop-blur-md space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Laptop className="size-4 text-primary" />
          Runtime Environment
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
            <span className="text-muted-foreground font-medium">Framework</span>
            <p className="font-bold text-foreground">TanStack Start + React 19</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
            <span className="text-muted-foreground font-medium">Database</span>
            <p className="font-bold text-foreground">Drizzle ORM + LibSQL SQLite</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
            <span className="text-muted-foreground font-medium">Design System</span>
            <p className="font-bold text-foreground">Coss UI Primitives & Tailwind v4</p>
          </div>
        </div>
      </div>
    </div>
  )
}
