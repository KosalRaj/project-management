import { useState, useEffect } from 'react'
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
import type { Item, ItemCategory, ItemPriority, ItemStatus } from '@/db/schema'
import { useShakeError } from '@/components/ui/transitions'
import { AVATAR_PRESETS } from './types'
import { Calendar, User, DollarSign, Tag } from 'lucide-react'

const STATUS_ITEMS: { label: string; value: ItemStatus; dot: string }[] = [
  { label: 'Backlog', value: 'backlog', dot: 'bg-slate-500' },
  { label: 'In Progress', value: 'in_progress', dot: 'bg-blue-500' },
  { label: 'In Review', value: 'in_review', dot: 'bg-amber-500' },
  { label: 'Completed', value: 'completed', dot: 'bg-emerald-500' },
]

const PRIORITY_ITEMS: { label: string; value: ItemPriority; dot: string }[] = [
  { label: 'Urgent', value: 'urgent', dot: 'bg-rose-500' },
  { label: 'High', value: 'high', dot: 'bg-orange-500' },
  { label: 'Medium', value: 'medium', dot: 'bg-amber-500' },
  { label: 'Low', value: 'low', dot: 'bg-teal-500' },
]

const CATEGORY_ITEMS: { label: string; value: ItemCategory }[] = [
  { label: 'Engineering', value: 'engineering' },
  { label: 'Design', value: 'design' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Operations', value: 'operations' },
  { label: 'Finance', value: 'finance' },
]

interface ItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: Item | null
  onSubmit: (data: {
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
  }) => Promise<void>
  isSubmitting: boolean
}

export function ItemModal({
  open,
  onOpenChange,
  item,
  onSubmit,
  isSubmitting,
}: ItemModalProps) {
  const isEdit = Boolean(item && item.id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ItemStatus>('backlog')
  const [priority, setPriority] = useState<ItemPriority>('medium')
  const [category, setCategory] = useState<ItemCategory>('engineering')
  const [assigneeName, setAssigneeName] = useState('Elena Rostova')
  const [assigneeAvatar, setAssigneeAvatar] = useState(AVATAR_PRESETS[0].avatar)
  const [dueDate, setDueDate] = useState('')
  const [progress, setProgress] = useState(0)
  const [budget, setBudget] = useState(5000)
  const [tagsString, setTagsString] = useState('')
  const shake = useShakeError(3500)

  useEffect(() => {
    if (item && item.id) {
      setTitle(item.title || '')
      setDescription(item.description || '')
      setStatus((item.status as ItemStatus) || 'backlog')
      setPriority((item.priority as ItemPriority) || 'medium')
      setCategory((item.category as ItemCategory) || 'engineering')
      setAssigneeName(item.assigneeName || 'Elena Rostova')
      setAssigneeAvatar(item.assigneeAvatar || AVATAR_PRESETS[0].avatar)
      setDueDate(item.dueDate || '')
      setProgress(item.progress ?? 0)
      setBudget(item.budget ?? 0)
      try {
        const parsedTags = JSON.parse(item.tags || '[]')
        setTagsString(Array.isArray(parsedTags) ? parsedTags.join(', ') : '')
      } catch {
        setTagsString('')
      }
    } else if (item && !item.id) {
      // Pre-filled status
      setTitle('')
      setDescription('')
      setStatus((item.status as ItemStatus) || 'backlog')
      setPriority('medium')
      setCategory('engineering')
      setAssigneeName(AVATAR_PRESETS[0].name)
      setAssigneeAvatar(AVATAR_PRESETS[0].avatar)
      setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
      setProgress(0)
      setBudget(5000)
      setTagsString('Feature, Q3')
    } else {
      setTitle('')
      setDescription('')
      setStatus('backlog')
      setPriority('medium')
      setCategory('engineering')
      setAssigneeName(AVATAR_PRESETS[0].name)
      setAssigneeAvatar(AVATAR_PRESETS[0].avatar)
      setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
      setProgress(0)
      setBudget(5000)
      setTagsString('Feature, Q3')
    }
    shake.clearError()
  }, [item, open])

  const handleAssigneeChange = (selectedName: string) => {
    setAssigneeName(selectedName)
    const matched = AVATAR_PRESETS.find((p) => p.name === selectedName)
    if (matched) {
      setAssigneeAvatar(matched.avatar)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    shake.clearError()
    if (!title.trim()) {
      shake.triggerError('Title is required')
      return
    }

    const tagsArray = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      await onSubmit({
        id: item?.id || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        category,
        assigneeName,
        assigneeAvatar,
        dueDate,
        progress,
        budget,
        tags: JSON.stringify(tagsArray),
      })
      onOpenChange(false)
    } catch (err: any) {
      shake.triggerError(err?.message || 'Failed to save item')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className={`max-w-xl max-h-[90vh] overflow-y-auto ${shake.isShaking ? 'is-shaking' : ''}`}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Initiative' : 'Create New Initiative'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the project specifications, assigned team members, and timeline.'
                : 'Define a new project milestone, track deliverables, and allocate resources.'}
            </DialogDescription>
          </DialogHeader>

          <DialogPanel className="space-y-4 py-2">
            <div className={`t-input-wrap ${shake.isError ? 'is-error' : ''}`}>
              {shake.errorText && (
                <div className="t-error-msg rounded-lg bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {shake.errorText}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Initiative Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Modernize Distributed Storage Architecture"
                className="bg-background text-sm font-medium"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Description & Goals
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about acceptance criteria, key stakeholders, and architecture goals..."
                className="bg-background text-sm min-h-[80px]"
              />
            </div>

            {/* Status, Priority & Category in 3 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Status
                </label>
                <Select
                  value={status}
                  onValueChange={(val) => val && setStatus(val as ItemStatus)}
                >
                  <SelectTrigger aria-label="Initiative status" className="w-full h-9 bg-background px-2.5 text-xs font-medium">
                    <SelectValue placeholder="Select status">
                      {(val) => {
                        const item = STATUS_ITEMS.find((i) => i.value === val) || STATUS_ITEMS[0]
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
                    {STATUS_ITEMS.map((item) => (
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
                  Priority
                </label>
                <Select
                  value={priority}
                  onValueChange={(val) => val && setPriority(val as ItemPriority)}
                >
                  <SelectTrigger aria-label="Initiative priority" className="w-full h-9 bg-background px-2.5 text-xs font-medium">
                    <SelectValue placeholder="Select priority">
                      {(val) => {
                        const item = PRIORITY_ITEMS.find((i) => i.value === val) || PRIORITY_ITEMS[0]
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
                    {PRIORITY_ITEMS.map((item) => (
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
                  Category
                </label>
                <Select
                  value={category}
                  onValueChange={(val) => val && setCategory(val as ItemCategory)}
                >
                  <SelectTrigger aria-label="Initiative category" className="w-full h-9 bg-background px-2.5 text-xs font-medium">
                    <SelectValue placeholder="Select category">
                      {(val) => {
                        const item = CATEGORY_ITEMS.find((i) => i.value === val) || CATEGORY_ITEMS[0]
                        return <span className="truncate">{item.label}</span>
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {CATEGORY_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="text-xs">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
            </div>

            {/* Assignee & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <User className="size-3.5" />
                  Assignee
                </label>
                {/* Rich avatar select (p-select-20 style) */}
                <Select
                  value={assigneeName}
                  onValueChange={(val) => val && handleAssigneeChange(val as string)}
                >
                  <SelectTrigger aria-label="Select assignee" className="w-full h-9 bg-background px-2 text-xs">
                    <SelectValue placeholder="Select assignee">
                      {(name) => {
                        const person = AVATAR_PRESETS.find((p) => p.name === name) || AVATAR_PRESETS[0]
                        const initials = person.name.split(' ').map((n) => n[0]).join('')
                        return (
                          <span className="flex items-center gap-2 truncate">
                            <Avatar className="size-5">
                              <AvatarImage src={person.avatar} alt={person.name} />
                              <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="truncate font-medium">{person.name}</span>
                          </span>
                        )
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {AVATAR_PRESETS.map((person) => {
                      const initials = person.name.split(' ').map((n) => n[0]).join('')
                      return (
                        <SelectItem key={person.name} value={person.name} className="py-1.5 text-xs">
                          <span className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarImage src={person.avatar} alt={person.name} />
                              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="truncate font-medium">{person.name}</span>
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectPopup>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  Target Due Date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 bg-background text-xs"
                />
              </div>
            </div>

            {/* Progress & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Completion Progress
                  </label>
                  <span className="text-xs font-bold text-foreground">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <DollarSign className="size-3.5" />
                  Budget Allocation ($)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="500"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  placeholder="5000"
                  className="h-9 bg-background text-xs"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Tag className="size-3.5" />
                Tags (comma separated)
              </label>
              <Input
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
                placeholder="Database, Security, Cloudflare, Sprint-42"
                className="h-9 bg-background text-xs"
              />
            </div>
          </DialogPanel>

          <DialogFooter className="mt-4">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? <Spinner className="size-4" /> : null}
              <span>{isEdit ? 'Save Changes' : 'Create Initiative'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
