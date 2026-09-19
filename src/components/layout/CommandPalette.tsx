import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Dialog,
  DialogPopup,
  DialogPanel,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getTasksFn } from '@/server/tasks'
import { getProjectsFn } from '@/server/projects'
import { getUsersFn } from '@/server/users'
import type { Task, SafeUser } from '@/db/schema'
import type { ProjectWithStats } from '@/server/projects'
import {
  Search,
  CheckSquare,
  Folder,
  Users,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenCreateTask?: () => void
  onOpenCreateProject?: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenCreateTask,
  onOpenCreateProject,
}: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [users, setUsers] = useState<SafeUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load searchable data when opened
  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
      return
    }

    let isMounted = true
    setIsLoading(true)

    Promise.all([getTasksFn(), getProjectsFn(), getUsersFn()])
      .then(([t, p, u]) => {
        if (!isMounted) return
        setTasks(t)
        setProjects(p)
        setUsers(u)
      })
      .catch((err) => console.error('Failed to load command palette data:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open])

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Built-in Quick Actions
  const quickActions = useMemo(() => {
    return [
      {
        id: 'act-new-task',
        title: 'Create New Task',
        category: 'Actions',
        icon: Plus,
        shortcut: 'C',
        action: () => {
          onOpenChange(false)
          onOpenCreateTask?.()
        },
      },
      {
        id: 'act-new-proj',
        title: 'Create New Project',
        category: 'Actions',
        icon: Folder,
        shortcut: 'P',
        action: () => {
          onOpenChange(false)
          onOpenCreateProject?.()
        },
      },
      {
        id: 'act-go-tasks',
        title: 'Go to Tasks & Issues Explorer',
        category: 'Navigation',
        icon: CheckSquare,
        shortcut: 'G T',
        action: () => {
          onOpenChange(false)
          navigate({ to: '/tasks' })
        },
      },
      {
        id: 'act-go-projects',
        title: 'Go to Projects Hub',
        category: 'Navigation',
        icon: Folder,
        shortcut: 'G P',
        action: () => {
          onOpenChange(false)
          navigate({ to: '/projects' })
        },
      },
      {
        id: 'act-go-analytics',
        title: 'Go to Executive Analytics',
        category: 'Navigation',
        icon: BarChart3,
        shortcut: 'G A',
        action: () => {
          onOpenChange(false)
          navigate({ to: '/analytics' })
        },
      },
      {
        id: 'act-go-users',
        title: 'Go to Team Directory',
        category: 'Navigation',
        icon: Users,
        shortcut: 'G U',
        action: () => {
          onOpenChange(false)
          navigate({ to: '/users' })
        },
      },
      {
        id: 'act-go-settings',
        title: 'Go to Workspace Settings',
        category: 'Navigation',
        icon: Settings,
        shortcut: 'G S',
        action: () => {
          onOpenChange(false)
          navigate({ to: '/settings' })
        },
      },
    ]
  }, [navigate, onOpenChange, onOpenCreateTask, onOpenCreateProject])

  // Filtered items
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase()

    // 1. Filter actions
    const matchedActions = quickActions.filter(
      (a) => !q || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q),
    )

    // 2. Filter projects
    const matchedProjects = projects
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))
      .slice(0, 4)

    // 3. Filter tasks
    const matchedTasks = tasks
      .filter(
        (t) =>
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.taskKey.toLowerCase().includes(q) ||
          (t.assigneeName && t.assigneeName.toLowerCase().includes(q)),
      )
      .slice(0, 6)

    // 4. Filter users
    const matchedUsers = users
      .filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q)),
      )
      .slice(0, 3)

    return {
      actions: matchedActions,
      projects: matchedProjects,
      tasks: matchedTasks,
      users: matchedUsers,
      totalCount: matchedActions.length + matchedProjects.length + matchedTasks.length + matchedUsers.length,
    }
  }, [query, quickActions, projects, tasks, users])

  // Flat list for keyboard indexing
  const flatItems = useMemo(() => {
    const list: { id: string; run: () => void }[] = []

    filteredResults.actions.forEach((a) => list.push({ id: a.id, run: a.action }))
    filteredResults.projects.forEach((p) =>
      list.push({
        id: `p-${p.id}`,
        run: () => {
          onOpenChange(false)
          navigate({ to: '/projects/$projectId', params: { projectId: p.id } })
        },
      }),
    )
    filteredResults.tasks.forEach((t) =>
      list.push({
        id: `t-${t.id}`,
        run: () => {
          onOpenChange(false)
          navigate({ to: '/tasks' })
        },
      }),
    )
    filteredResults.users.forEach((u) =>
      list.push({
        id: `u-${u.id}`,
        run: () => {
          onOpenChange(false)
          navigate({ to: '/users' })
        },
      }),
    )

    return list
  }, [filteredResults, navigate, onOpenChange])

  // Key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].run()
      }
    }
  }

  let runningIndex = 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-xl p-0 overflow-hidden border border-border/80 shadow-2xl bg-card/95 backdrop-blur-xl">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
          <Search className="size-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, task (e.g. CORE-101), project, or person..."
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-9 px-0 bg-transparent"
          />
          <Badge variant="outline" className="hidden sm:flex text-[10px] font-mono font-medium text-muted-foreground">
            ESC to close
          </Badge>
        </div>

        {/* Results List */}
        <DialogPanel className="max-h-96 overflow-y-auto p-2 space-y-4">
          {filteredResults.totalCount === 0 && !isLoading && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No matching tasks, projects, or commands found for "{query}".
            </div>
          )}

          {/* Quick Actions */}
          {filteredResults.actions.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Quick Actions
              </div>
              <div className="space-y-0.5">
                {filteredResults.actions.map((act) => {
                  const currentIndex = runningIndex++
                  const isSelected = selectedIndex === currentIndex
                  const Icon = act.icon
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={act.action}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground/90 hover:bg-muted/60'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span>{act.title}</span>
                      </span>
                      {act.shortcut && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                          {act.shortcut}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Projects */}
          {filteredResults.projects.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Projects
              </div>
              <div className="space-y-0.5">
                {filteredResults.projects.map((proj) => {
                  const currentIndex = runningIndex++
                  const isSelected = selectedIndex === currentIndex
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => {
                        onOpenChange(false)
                        navigate({ to: '/projects/$projectId', params: { projectId: proj.id } })
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground/90 hover:bg-muted/60'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Folder className="size-4 shrink-0 text-sky-500" />
                        <span className="font-mono font-bold text-primary mr-1">[{proj.key}]</span>
                        <span className="truncate">{proj.name}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{proj.totalTasks} tasks</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tasks */}
          {filteredResults.tasks.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Tasks & Issues
              </div>
              <div className="space-y-0.5">
                {filteredResults.tasks.map((task) => {
                  const currentIndex = runningIndex++
                  const isSelected = selectedIndex === currentIndex
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => {
                        onOpenChange(false)
                        navigate({ to: '/tasks' })
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground/90 hover:bg-muted/60'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate min-w-0">
                        <CheckSquare className="size-4 shrink-0 text-muted-foreground" />
                        <span className="font-mono font-bold text-primary shrink-0">[{task.taskKey}]</span>
                        <span className="truncate">{task.title}</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 ml-2">
                        {task.status.replace('_', ' ')}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Team Members */}
          {filteredResults.users.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Team Members
              </div>
              <div className="space-y-0.5">
                {filteredResults.users.map((u) => {
                  const currentIndex = runningIndex++
                  const isSelected = selectedIndex === currentIndex
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onOpenChange(false)
                        navigate({ to: '/users' })
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground/90 hover:bg-muted/60'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Avatar className="size-6 border border-border">
                          <AvatarImage src={u.avatar || undefined} />
                          <AvatarFallback className="text-[9px]">{u.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                        <span className="text-[10px] text-muted-foreground">{u.department}</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 capitalize font-medium">
                        {u.role}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </DialogPanel>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-t border-border/50 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono font-bold bg-card border border-border/80 px-1 rounded text-[10px]">↑</kbd>
              <kbd className="font-mono font-bold bg-card border border-border/80 px-1 rounded text-[10px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono font-bold bg-card border border-border/80 px-1 rounded text-[10px]">↵</kbd>
              Select
            </span>
          </div>
          <span className="font-medium">⌘K Shortcut</span>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
