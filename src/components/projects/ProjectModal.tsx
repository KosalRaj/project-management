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
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useShakeError } from '@/components/ui/transitions'
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
  }, [project, open, users])

  // Auto-generate key from name if new project
  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEdit && (!key || key.length <= 4)) {
      const generated = val
        .split(' ')
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className={`max-w-xl max-h-[90vh] overflow-y-auto ${shake.isShaking ? 'is-shaking' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="size-5 text-primary" />
            {isEdit ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Projects group tasks, milestones, budgets, and track team velocity.
          </DialogDescription>
        </DialogHeader>

        {shake.errorText && (
          <div className="t-error-msg p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2 mx-6 mt-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{shake.errorText}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <DialogPanel className="space-y-4">
            {/* Name & Key */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Project Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Next-Gen Core Engine"
                  required
                  className="text-sm h-9 bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Key *
                </label>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="CORE"
                  maxLength={6}
                  disabled={isEdit}
                  required
                  className={`text-sm h-9 font-mono uppercase bg-background ${isEdit ? 'opacity-70' : ''}`}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Overview & Mission
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High level objectives and scope for this project track..."
                rows={2}
                className="w-full p-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            </div>

            {/* Icon & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Color Theme
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {Object.keys(PROJECT_COLOR_MAP).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`size-6 rounded-full border transition-all ${
                        c === 'sky'
                          ? 'bg-sky-500'
                          : c === 'indigo'
                          ? 'bg-indigo-500'
                          : c === 'violet'
                          ? 'bg-violet-500'
                          : c === 'emerald'
                          ? 'bg-emerald-500'
                          : c === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      } ${color === c ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Project Icon
                </label>
                <div className="flex items-center gap-1.5">
                  {Object.entries(PROJECT_ICONS).map(([iconKey, IconComp]) => (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setIcon(iconKey)}
                      className={`size-7 rounded-lg border flex items-center justify-center transition-all ${
                        icon === iconKey
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border/70 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <IconComp className="size-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Health & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Project Health
                </label>
                <Select
                  value={health}
                  onValueChange={(val) => setHealth((val as ProjectHealth) || 'on_track')}
                >
                  <SelectTrigger className="h-9 w-full bg-background text-xs font-medium">
                    <SelectValue placeholder="Health">
                      {(val) => {
                        const h = (val as ProjectHealth) || 'on_track'
                        const cfg = PROJECT_HEALTH_CONFIG[h] || PROJECT_HEALTH_CONFIG.on_track
                        return (
                          <span className="flex items-center gap-1.5 truncate">
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
                        <span className="flex items-center gap-1.5">
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
                  <SelectTrigger className="h-9 w-full bg-background text-xs font-medium capitalize">
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
                  <SelectTrigger className="h-9 w-full bg-background text-xs font-medium">
                    <SelectValue placeholder="Select Lead">
                      {(val) => {
                        if (!val || val === 'unassigned') return 'Unassigned'
                        const u = users.find((user) => user.id === val)
                        return u ? `${u.name} (${u.role})` : 'Unassigned'
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="unassigned" className="text-xs">
                      Unassigned
                    </SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs">
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
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
                  className="text-xs h-9 bg-background"
                />
              </div>
            </div>

            {/* Timeline Dates */}
            <div className="grid grid-cols-2 gap-3">
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

          <DialogFooter className="border-t border-border/50 pt-3">
            <DialogClose render={<Button variant="outline" size="sm" type="button" />}>
              Cancel
            </DialogClose>
            <Button size="sm" type="submit" disabled={isSubmitting} className="gap-1.5 shadow-xs">
              {isSubmitting && <Spinner className="size-3.5" />}
              {isEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
