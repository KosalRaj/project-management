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
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useShakeError } from '@/components/ui/transitions'
import { cn } from '@/lib/utils'
import type { Project, ProjectStatus, ProjectHealth, SafeUser } from '@/db/schema'
import {
  PROJECT_HEALTH_CONFIG,
  PROJECT_COLOR_MAP,
  PROJECT_ICONS,
} from '@/components/tasks/types'
import {
  Folder,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  Check,
  Hash,
  Sparkles,
} from 'lucide-react'

interface ProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  users: SafeUser[]
  onSubmit: (data: {
    id?: string
    key: string
    name: string
    description?: string
    icon: string
    color: string
    status: ProjectStatus
    health: ProjectHealth
    leadId?: string
    leadName?: string
    leadAvatar?: string
    startDate?: string
    targetDate?: string
    budget: number
  }) => Promise<void>
  isSubmitting?: boolean
}

const COLOR_OPTIONS: { id: string; label: string; bg: string }[] = [
  { id: 'sky', label: 'Sky Blue', bg: 'bg-sky-500' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { id: 'violet', label: 'Violet', bg: 'bg-violet-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
]

export function ProjectModal({
  open,
  onOpenChange,
  project,
  users,
  onSubmit,
  isSubmitting = false,
}: ProjectModalProps) {
  const isEdit = !!project && !!project.id

  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('Folder')
  const [color, setColor] = useState('sky')
  const [status, setStatus] = useState<ProjectStatus>('active')
  const [health, setHealth] = useState<ProjectHealth>('on_track')
  const [leadId, setLeadId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [budget, setBudget] = useState(100000)

  const shake = useShakeError(3500)

  useEffect(() => {
    if (project && project.id) {
      setKey(project.key)
      setName(project.name)
      setDescription(project.description || '')
      setIcon(project.icon || 'Folder')
      setColor(project.color || 'sky')
      setStatus((project.status as ProjectStatus) || 'active')
      setHealth((project.health as ProjectHealth) || 'on_track')
      setLeadId(project.leadId || '')
      setStartDate(project.startDate || '')
      setTargetDate(project.targetDate || '')
      setBudget(project.budget || 0)
    } else {
      setKey('')
      setName('')
      setDescription('')
      setIcon('Folder')
      setColor('sky')
      setStatus('active')
      setHealth('on_track')
      setLeadId(users[0]?.id ?? '')
      setStartDate('')
      setTargetDate('')
      setBudget(100000)
    }
    shake.clearError()
  }, [project, open, users])

  // Auto-generate key from name if new project
  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEdit && (!key || key.length <= 4)) {
      const generated = val
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .slice(0, 5)
        .toUpperCase()
      if (generated) setKey(generated)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    shake.clearError()

    if (!name.trim()) {
      shake.triggerError('Project name is required.')
      return
    }

    if (!key.trim()) {
      shake.triggerError('Project key (e.g. CORE, APP) is required.')
      return
    }

    const assignedLead = users.find((u) => u.id === leadId)

    try {
      await onSubmit({
        id: project?.id,
        key: key.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        status,
        health,
        leadId: assignedLead?.id || undefined,
        leadName: assignedLead?.name || undefined,
        leadAvatar: assignedLead?.avatar || undefined,
        startDate: startDate || undefined,
        targetDate: targetDate || undefined,
        budget: Number(budget) || 0,
      })
      onOpenChange(false)
    } catch (err: any) {
      shake.triggerError(err?.message || 'Failed to save project')
    }
  }

  const IconComponent = PROJECT_ICONS[icon] || Folder
  const themeStyles = PROJECT_COLOR_MAP[color] || PROJECT_COLOR_MAP.sky

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className={cn('sm:max-w-xl', shake.isShaking && 'is-shaking')}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-10 items-center justify-center rounded-xl border transition-all duration-200 shadow-xs',
                themeStyles.bg,
                themeStyles.text,
                themeStyles.border
              )}
            >
              <IconComponent className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {isEdit ? 'Edit Project' : 'Create New Project'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isEdit
                  ? `Update configuration, lead, and timeline for ${project?.name || 'this project'}.`
                  : 'Define project scope, key, ownership, and track sprint deliverables.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="contents">
          <DialogPanel className="space-y-4.5">
            {shake.errorText && (
              <div className="t-error-msg p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{shake.errorText}</span>
              </div>
            )}

            {/* Name & Key */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <span>Project Name</span>
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Next-Gen Core Engine"
                  required
                  autoFocus
                  className="text-sm h-9 bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Hash className="size-3 text-muted-foreground" />
                  <span>Key</span>
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="CORE"
                  maxLength={6}
                  disabled={isEdit}
                  required
                  className={cn(
                    'text-sm h-9 font-mono font-bold uppercase bg-background',
                    isEdit && 'opacity-70 cursor-not-allowed'
                  )}
                />
              </div>
            </div>

            {/* Overview & Mission */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Overview & Mission
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level objectives, technical scope, and roadmap targets for this project..."
                rows={2}
                className="bg-background text-xs"
              />
            </div>

            {/* Color Theme & Project Icon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border/60 bg-muted/20 p-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="size-3 text-primary" /> Color Theme
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => {
                    const isSelected = color === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColor(c.id)}
                        title={c.label}
                        aria-label={c.label}
                        className={cn(
                          'relative size-6.5 rounded-full transition-all duration-150 flex items-center justify-center cursor-pointer',
                          c.bg,
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground/60 scale-110 shadow-xs'
                            : 'opacity-75 hover:opacity-100 hover:scale-105'
                        )}
                      >
                        {isSelected && <Check className="size-3 text-white stroke-[3]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Folder className="size-3 text-muted-foreground" /> Project Icon
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.entries(PROJECT_ICONS).map(([iconKey, IconItem]) => {
                    const isSelected = icon === iconKey
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setIcon(iconKey)}
                        title={iconKey}
                        aria-label={iconKey}
                        className={cn(
                          'size-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-background hover:bg-muted border-border/70 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <IconItem className="size-3.5" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Health & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Project Health
                </label>
                <Select
                  value={health}
                  onValueChange={(val) => setHealth((val as ProjectHealth) || 'on_track')}
                >
                  <SelectTrigger className="h-9 w-full bg-background text-xs font-medium px-2.5">
                    <SelectValue placeholder="Health">
                      {(val) => {
                        const h = (val as ProjectHealth) || 'on_track'
                        const cfg = PROJECT_HEALTH_CONFIG[h] || PROJECT_HEALTH_CONFIG.on_track
                        return (
                          <span className="flex items-center gap-2 truncate">
                            <span className={`size-2 rounded-full ${cfg.dot}`} />
                            <span className="truncate">{cfg.label}</span>
                          </span>
                        )
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {Object.entries(PROJECT_HEALTH_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        <span className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${v.dot}`} />
                          <span>{v.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Status
                </label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus((val as ProjectStatus) || 'active')}
                >
                  <SelectTrigger className="h-9 w-full bg-background text-xs font-medium capitalize px-2.5">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectPopup>
                    {(['planning', 'active', 'paused', 'completed', 'canceled'] as ProjectStatus[]).map((st) => (
                      <SelectItem key={st} value={st} className="text-xs capitalize">
                        {st}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
            </div>

            {/* Project Lead & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <User className="size-3.5" /> Project Lead
                </label>
                <Select
                  value={leadId || 'unassigned'}
                  onValueChange={(val) => setLeadId(val === 'unassigned' ? '' : (val as string))}
                >
                  <SelectTrigger className="h-9 w-full bg-background text-xs font-medium px-2.5">
                    <SelectValue placeholder="Select Lead">
                      {(val) => {
                        if (!val || val === 'unassigned') {
                          return (
                            <span className="flex items-center gap-2 text-muted-foreground truncate">
                              <User className="size-3.5 text-muted-foreground/60" />
                              <span>Unassigned</span>
                            </span>
                          )
                        }
                        const u = users.find((user) => user.id === val)
                        if (!u) return 'Unassigned'
                        const initials = u.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                        return (
                          <span className="flex items-center gap-2 truncate">
                            <Avatar className="size-5 shrink-0">
                              {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                              <AvatarFallback className="text-[9px] font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate font-medium text-foreground">{u.name}</span>
                            <span className="text-[11px] text-muted-foreground truncate">
                              ({u.role})
                            </span>
                          </span>
                        )
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="unassigned" className="text-xs">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <User className="size-3.5" />
                        <span>Unassigned</span>
                      </span>
                    </SelectItem>
                    {users.map((u) => {
                      const initials = u.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                      return (
                        <SelectItem key={u.id} value={u.id} className="py-1.5 text-xs">
                          <span className="flex items-center gap-2">
                            <Avatar className="size-5 shrink-0">
                              {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                              <AvatarFallback className="text-[9px] font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{u.name}</span>
                            <span className="text-muted-foreground text-[11px]">({u.role})</span>
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectPopup>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <DollarSign className="size-3.5" /> Allocated Budget ($)
                </label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  min={0}
                  step={5000}
                  className="text-xs h-9 bg-background font-mono"
                />
              </div>
            </div>

            {/* Timeline Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Calendar className="size-3.5" /> Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs h-9 bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Calendar className="size-3.5" /> Target Date
                </label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="text-xs h-9 bg-background"
                />
              </div>
            </div>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="default" type="button" />}>
              Cancel
            </DialogClose>
            <Button size="default" type="submit" disabled={isSubmitting} className="gap-1.5 shadow-xs">
              {isSubmitting && <Spinner className="size-3.5" />}
              {isEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
