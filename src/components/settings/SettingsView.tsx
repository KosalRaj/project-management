import React, { useState, useEffect } from 'react'
import { usePermissions } from '@/lib/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogPanel, DialogFooter } from '@/components/ui/dialog'
import { updateUserFn, resetUserPasswordFn } from '@/server/users'
import { resetAndSeedWorkspaceFn } from '@/server/projects'
import {
  verifySmtpConfigFn,
  sendTestEmailFn,
  getEmailLogsFn,
  updateNotificationPreferencesFn,
} from '@/server/email'
import type { NotificationPreferences, EmailLog } from '@/db/schema'
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
  Database,
  RotateCcw,
  Send,
  Radio,
  FileText,
  Clock,
  Eye,
  BellRing,
  ShieldCheck,
} from 'lucide-react'

export function SettingsView() {
  const { user, token, isAdmin, refetchUser } = usePermissions()

  // Profile Form
  const [name, setName] = useState(user?.name || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [title, setTitle] = useState(user?.title || '')

  // Password Form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Notification Preferences
  const defaultPrefs: NotificationPreferences = {
    notifyOnTaskAssigned: true,
    notifyOnStatusChange: true,
    notifyOnHealthAlert: true,
    notifyOnMention: true,
  }
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => {
    try {
      return user?.notificationPreferences
        ? JSON.parse(user.notificationPreferences)
        : defaultPrefs
    } catch {
      return defaultPrefs
    }
  })
  const [, setIsSavingPrefs] = useState(false)
  const [prefsSavedMsg, setPrefsSavedMsg] = useState(false)

  // SMTP & Diagnostic Tools
  const [smtpInfo, setSmtpInfo] = useState<{
    provider: string
    configured: boolean
    host: string
    port: string
    user: string
    fromEmail: string
    connectionStatus: 'connected' | 'simulated' | 'failed'
    connectionMessage: string
  } | null>(null)
  const [, setIsCheckingSmtp] = useState(false)

  // Test Email
  const [testTargetEmail, setTestTargetEmail] = useState(user?.email || '')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testEmailMsg, setTestEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Email Logs Inspector Modal
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false)
  const [emailLogsList, setEmailLogsList] = useState<EmailLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [selectedEmailForPreview, setSelectedEmailForPreview] = useState<EmailLog | null>(null)

  // Loading States
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSeedingWorkspace, setIsSeedingWorkspace] = useState(false)

  // Feedback Messages
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [seedMsg, setSeedMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch SMTP status on load
  useEffect(() => {
    fetchSmtpStatus()
  }, [])

  const fetchSmtpStatus = async () => {
    setIsCheckingSmtp(true)
    try {
      const info = await verifySmtpConfigFn()
      setSmtpInfo(info)
    } catch (err) {
      console.error('Failed to verify SMTP config:', err)
    } finally {
      setIsCheckingSmtp(false)
    }
  }

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
          token: token || undefined,
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
          token: token || undefined,
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

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    setIsSavingPrefs(true)
    try {
      await updateNotificationPreferencesFn({
        data: {
          preferences: updated,
          token: token || undefined,
        },
      })
      setPrefsSavedMsg(true)
      setTimeout(() => setPrefsSavedMsg(false), 3000)
    } catch (err) {
      console.error('Failed to update preferences:', err)
    } finally {
      setIsSavingPrefs(false)
    }
  }

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testTargetEmail.trim()) return
    setIsSendingTest(true)
    setTestEmailMsg(null)
    try {
      const res = await sendTestEmailFn({
        data: {
          targetEmail: testTargetEmail.trim(),
          token: token || undefined,
        },
      })
      if (res.status === 'delivered') {
        setTestEmailMsg({ type: 'success', text: `Test email successfully dispatched to ${testTargetEmail} via SMTP!` })
      } else if (res.status === 'simulated') {
        setTestEmailMsg({
          type: 'success',
          text: `Test email logged in Simulated Outbox for ${testTargetEmail}. (View in Email Logs below).`,
        })
      } else {
        setTestEmailMsg({ type: 'error', text: res.error || 'Failed to send test email.' })
      }
    } catch (err: any) {
      setTestEmailMsg({ type: 'error', text: err?.message || 'Failed to trigger test email' })
    } finally {
      setIsSendingTest(false)
    }
  }

  const handleOpenEmailLogs = async () => {
    setIsLogsModalOpen(true)
    setIsLoadingLogs(true)
    try {
      const logs = await getEmailLogsFn({ data: { token: token || undefined } })
      setEmailLogsList(logs)
    } catch (err) {
      console.error('Failed to fetch email logs:', err)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const handleSeedWorkspace = async () => {
    if (!isAdmin) return
    setIsSeedingWorkspace(true)
    setSeedMsg(null)
    try {
      await resetAndSeedWorkspaceFn({ data: { token: token || undefined } })
      setSeedMsg({ type: 'success', text: 'Workspace successfully reset and populated with rich sample projects, tasks, and initiatives!' })
    } catch (err: any) {
      setSeedMsg({ type: 'error', text: err?.message || 'Failed to seed workspace' })
    } finally {
      setIsSeedingWorkspace(false)
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
          Manage your personal details, credentials, email verification, and notification delivery infrastructure.
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
              {user?.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  <ShieldCheck className="size-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  <AlertCircle className="size-3" /> Unverified
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.title || 'Team Member'} &bull; {user?.department || 'General'}
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
                <UserIcon className="size-3.5" /> Full Name
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
                <Mail className="size-3.5" /> Email Address
              </label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-muted text-sm h-9 cursor-not-allowed opacity-75"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Building2 className="size-3.5" /> Department
              </label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-background text-sm h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Briefcase className="size-3.5" /> Job Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background text-sm h-9"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" type="submit" disabled={isSavingProfile} className="gap-1.5 cursor-pointer">
              {isSavingProfile && <Spinner className="size-3.5" />}
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      {/* Email Notification Preferences Card */}
      <div className="rounded-2xl border border-border/70 bg-card/85 p-6 shadow-xs backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <BellRing className="size-4 text-primary" />
              Email Notification Preferences
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose which workspace events trigger transactional emails to your inbox.
            </p>
          </div>
          {prefsSavedMsg && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="size-3.5" /> Preferences Saved
            </span>
          )}
        </div>

        <div className="space-y-3 pt-2">
          {/* Pref 1: Task Assignments */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-foreground">Task Assignments</span>
              <p className="text-[11px] text-muted-foreground">
                Receive an email immediately when you are assigned or re-assigned to a task.
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.notifyOnTaskAssigned}
              onChange={() => handleTogglePref('notifyOnTaskAssigned')}
              className="size-4.5 rounded accent-primary cursor-pointer"
            />
          </div>

          {/* Pref 2: Status Transitions */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-foreground">Task Status Transitions</span>
              <p className="text-[11px] text-muted-foreground">
                Receive alerts when your active tasks transition stages (e.g. In Review, Done).
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.notifyOnStatusChange}
              onChange={() => handleTogglePref('notifyOnStatusChange')}
              className="size-4.5 rounded accent-primary cursor-pointer"
            />
          </div>

          {/* Pref 3: Project Health Escalations */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-foreground">Project Health Escalations</span>
              <p className="text-[11px] text-muted-foreground">
                Receive critical alerts if projects you lead drop to <em>At Risk</em> or <em>Off Track</em>.
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.notifyOnHealthAlert}
              onChange={() => handleTogglePref('notifyOnHealthAlert')}
              className="size-4.5 rounded accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Email & SMTP Infrastructure Card (Admins / Diagnostics) */}
      <div className="rounded-2xl border border-border/70 bg-card/85 p-6 shadow-xs backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Radio className="size-4 text-primary" />
              Email & SMTP Delivery Engine
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Diagnostic status of outbound SMTP relay and local simulated delivery logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEmailLogs}
              className="gap-1.5 text-xs h-8 cursor-pointer"
            >
              <FileText className="size-3.5 text-muted-foreground" />
              Email Outbox Logs
            </Button>
          </div>
        </div>

        {/* Status Strip */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Relay Mode:</span>
            {smtpInfo?.connectionStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <CheckCircle2 className="size-3" /> Live SMTP Authenticated
              </span>
            ) : smtpInfo?.connectionStatus === 'simulated' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                <Clock className="size-3" /> Simulated Dev Outbox
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/25">
                <AlertCircle className="size-3" /> SMTP Error
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {smtpInfo?.connectionMessage}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-muted-foreground">
            <div><strong>Host:</strong> {smtpInfo?.host}</div>
            <div><strong>Port:</strong> {smtpInfo?.port}</div>
            <div><strong>Sender:</strong> {smtpInfo?.fromEmail}</div>
          </div>
        </div>

        {/* Send Test Email Tool */}
        <form onSubmit={handleSendTestEmail} className="pt-2 space-y-3">
          <label className="block text-xs font-bold text-foreground">
            Send Diagnostic Test Email
          </label>

          {testEmailMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testEmailMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
            >
              {testEmailMsg.type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
              {testEmailMsg.text}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              type="email"
              value={testTargetEmail}
              onChange={(e) => setTestTargetEmail(e.target.value)}
              placeholder="target@company.com"
              className="bg-background text-xs h-9"
              required
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSendingTest}
              className="gap-1.5 text-xs h-9 cursor-pointer shrink-0 font-semibold"
            >
              {isSendingTest ? <Spinner className="size-3.5" /> : <Send className="size-3.5" />}
              Send Test
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
                <Lock className="size-3.5" /> New Password
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
                <Lock className="size-3.5" /> Confirm Password
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
            <Button size="sm" type="submit" disabled={isChangingPassword} className="gap-1.5 cursor-pointer">
              {isChangingPassword && <Spinner className="size-3.5" />}
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Demo Data & Workspace Management */}
      <div className="rounded-2xl border border-border/70 bg-card/85 p-6 shadow-xs backdrop-blur-md space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Database className="size-4 text-primary" />
            Workspace & Demo Data Management
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reset or populate realistic sample data across projects, multi-stage tasks, subtasks, and roadmap initiatives.
          </p>
        </div>

        {seedMsg && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium border ${
              seedMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-destructive/10 text-destructive border-destructive/30'
            }`}
          >
            {seedMsg.type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
            <span>{seedMsg.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Reset & Seed Sample Workspace</span>
              {!isAdmin && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Lock className="size-2.5" /> Admin Only
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Loads full sample dataset with active sprint projects (CORE, UI, CLOUD), task pipelines, and assigned collaborators.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedWorkspace}
            disabled={!isAdmin || isSeedingWorkspace}
            className={`gap-2 text-xs h-8 shrink-0 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isSeedingWorkspace ? <Spinner className="size-3.5" /> : <RotateCcw className="size-3.5" />}
            Reset & Seed Data
          </Button>
        </div>
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

      {/* Email Outbox & Logs Modal */}
      <Dialog open={isLogsModalOpen} onOpenChange={setIsLogsModalOpen}>
        <DialogPopup className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Mail className="size-4 text-primary" />
              Email Outbox & Delivery Audit Trail
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Recent outbound emails, verification dispatches, and simulated inbox logs.
            </DialogDescription>
          </DialogHeader>

          <DialogPanel className="flex-1 overflow-y-auto space-y-4 py-2">
            {isLoadingLogs ? (
              <div className="py-12 text-center">
                <Spinner className="size-6 text-primary mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">Loading email dispatch history...</p>
              </div>
            ) : emailLogsList.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No outbound emails have been recorded yet.
              </div>
            ) : selectedEmailForPreview ? (
              /* Email HTML Preview sub-view */
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{selectedEmailForPreview.subject}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      To: <strong>{selectedEmailForPreview.recipientEmail}</strong> &bull; {new Date(selectedEmailForPreview.sentAt!).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEmailForPreview(null)}
                    className="text-xs h-7 cursor-pointer"
                  >
                    &larr; Back to List
                  </Button>
                </div>
                <div
                  className="rounded-xl border border-border/70 p-4 bg-slate-950 overflow-x-auto max-h-[50vh]"
                  dangerouslySetInnerHTML={{ __html: selectedEmailForPreview.htmlBody }}
                />
              </div>
            ) : (
              /* Email Logs Table */
              <div className="overflow-x-auto border border-border/60 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {emailLogsList.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-medium text-foreground truncate max-w-[150px]">
                          {log.recipientEmail}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[200px]">
                          {log.subject}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="capitalize text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {log.templateType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              log.status === 'delivered'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : log.status === 'simulated'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-rose-500/10 text-rose-500'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-muted-foreground">
                          {log.sentAt ? new Date(log.sentAt).toLocaleTimeString() : 'Just now'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEmailForPreview(log)}
                            className="h-7 text-xs gap-1 cursor-pointer"
                          >
                            <Eye className="size-3" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DialogPanel>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLogsModalOpen(false)}
              className="cursor-pointer text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
