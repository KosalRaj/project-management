import React, { useState, useEffect } from 'react'
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth-context'
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
import ThemeToggle from '@/components/ThemeToggle'
import { NotificationCenter } from './NotificationCenter'
import { CommandPalette } from './CommandPalette'
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog'
import { cn } from '@/lib/utils'
import {
  Layers,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
  ChevronRight,
  LayoutDashboard,
  Folder,
  CheckSquare,
  Search,
  HelpCircle,
  Command,
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // Global keyboard shortcuts listener
  useEffect(() => {
    let lastKey = ''
    let keyTimeout: any = null

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. ⌘K or Ctrl+K to open Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
        return
      }

      // Ignore other single key shortcuts if user is inside an input, textarea or select
      const activeEl = document.activeElement
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        activeEl?.getAttribute('contenteditable') === 'true'

      if (isInput) return

      // 2. '?' to open shortcuts
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShortcutsOpen(true)
        return
      }

      // 3. Two-key sequences (e.g. 'g' then 't')
      if (lastKey === 'g') {
        if (e.key === 't') {
          e.preventDefault()
          navigate({ to: '/tasks' })
        } else if (e.key === 'p') {
          e.preventDefault()
          navigate({ to: '/projects' })
        } else if (e.key === 'a') {
          e.preventDefault()
          navigate({ to: '/analytics' })
        } else if (e.key === 'u') {
          e.preventDefault()
          navigate({ to: '/users' })
        } else if (e.key === 's') {
          e.preventDefault()
          navigate({ to: '/settings' })
        }
        lastKey = ''
        clearTimeout(keyTimeout)
        return
      }

      if (e.key === 'g') {
        lastKey = 'g'
        clearTimeout(keyTimeout)
        keyTimeout = setTimeout(() => {
          lastKey = ''
        }, 1000)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(keyTimeout)
    }
  }, [navigate])

  const navItems = [
    {
      title: 'Projects',
      href: '/projects',
      icon: Folder,
      description: 'Roadmaps & project workspaces',
    },
    {
      title: 'Tasks & Issues',
      href: '/tasks',
      icon: CheckSquare,
      description: 'Cross-project sprint board',
    },
    {
      title: 'Initiatives',
      href: '/',
      icon: LayoutDashboard,
      description: 'Portfolio sprint board',
    },
    {
      title: 'Team & Users',
      href: '/users',
      icon: Users,
      description: 'Member roles & directory',
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Metrics & capacity velocity',
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Workspace preferences',
    },
  ]

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  const roleColorMap = {
    admin: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
    manager: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    member: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    guest: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  }

  const userRole = (user?.role || 'member') as keyof typeof roleColorMap

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground selection:bg-primary/20">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border/70 bg-card/70 backdrop-blur-xl sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border/60">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-sky-500 text-white dark:text-slate-950 shadow-sm shadow-slate-900/10 transition-transform group-hover:scale-105">
              <Layers className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                Initiative OS
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono font-semibold border-primary/20 bg-primary/5 text-primary">
                  PRO
                </Badge>
              </span>
              <span className="text-[11px] text-muted-foreground">Portfolio Engine</span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold border border-primary/20 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                )}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0 transition-transform group-hover:scale-110',
                    isActive ? 'text-primary dark:text-sky-400' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span className="flex-1 truncate">{item.title}</span>
                {isActive && <ChevronRight className="size-3.5 opacity-80 text-primary dark:text-sky-400" />}
              </Link>
            )
          })}
        </div>

        {/* Bottom User Pill */}
        <div className="p-3 border-t border-border/50">
          <Menu>
            <MenuTrigger className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/80 transition-all text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="size-8 ring-2 ring-primary/20 shrink-0">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'User'} />
                  <AvatarFallback className="text-xs font-semibold">
                    {user?.name
                      ? user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {user?.name || 'Signed In User'}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {user?.email || 'user@company.com'}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] h-4.5 px-1.5 capitalize font-medium ${roleColorMap[userRole]}`}>
                {user?.role || 'member'}
              </Badge>
            </MenuTrigger>
            <MenuPopup align="start" side="top" className="w-56 mb-2">
              <MenuGroup>
                <MenuGroupLabel>Account Options</MenuGroupLabel>
                <MenuItem onClick={() => navigate({ to: '/settings' })}>
                  <Settings className="size-3.5" />
                  Profile Settings
                </MenuItem>
                <MenuItem onClick={() => navigate({ to: '/users' })}>
                  <Users className="size-3.5" />
                  Team Directory
                </MenuItem>
              </MenuGroup>
              <MenuSeparator />
              <MenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="size-3.5" />
                Sign Out
              </MenuItem>
            </MenuPopup>
          </Menu>
        </div>
      </aside>

      {/* ================= MOBILE DRAWER ================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-card h-full border-r border-border shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-5 h-16 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Layers className="size-4.5" />
                </div>
                <span className="font-bold text-sm text-foreground">Initiative OS</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold border border-primary/20 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className={cn('size-4', isActive ? 'text-primary dark:text-sky-400' : 'text-muted-foreground')} />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>

            <div className="p-4 border-t border-border/50 space-y-2">
              <div className="flex items-center gap-2.5">
                <Avatar className="size-8">
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate">{user?.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="w-full justify-start gap-2 text-xs">
                <LogOut className="size-3.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-card/70 px-4 sm:px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              type="button"
              aria-label="Open mobile menu"
            >
              <MenuIcon className="size-5" />
            </button>

            {/* Breadcrumb / Page Title */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline font-medium">Workspace</span>
              <ChevronRight className="hidden sm:inline size-3.5" />
              <span className="font-semibold text-foreground capitalize">
                {currentPath === '/'
                  ? 'Initiatives Board'
                  : currentPath.replace('/', '').replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Quick ⌘K Search Button */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border/70 bg-muted/40 hover:bg-muted hover:border-border transition-all text-xs text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs"
            >
              <Search className="size-3.5" />
              <span className="hidden md:inline">Search...</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-background border border-border/70 text-foreground">
                <Command className="size-2.5" /> K
              </kbd>
            </button>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Keyboard Shortcuts Help */}
            <button
              type="button"
              onClick={() => setShortcutsOpen(true)}
              title="Keyboard Shortcuts (?)"
              className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/70 hover:border-border transition-all cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="size-4.5" />
            </button>

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />

            {/* User Dropdown */}
            <Menu>
              <MenuTrigger className="flex items-center gap-2 p-1.5 rounded-full hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
                <Avatar className="size-8">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'User'} />
                  <AvatarFallback className="text-xs font-bold text-primary">
                    {user?.name
                      ? user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
              </MenuTrigger>
              <MenuPopup align="end" className="w-56">
                <div className="px-3 py-2 border-b border-border/40">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  <Badge variant="outline" className={`mt-1.5 text-[9px] h-4 px-1.5 capitalize font-medium ${roleColorMap[userRole]}`}>
                    {user?.role || 'member'}
                  </Badge>
                </div>
                <MenuGroup>
                  <MenuItem onClick={() => navigate({ to: '/settings' })}>
                    <Settings className="size-3.5" />
                    Settings & Preferences
                  </MenuItem>
                  <MenuItem onClick={() => navigate({ to: '/users' })}>
                    <Users className="size-3.5" />
                    Team Members
                  </MenuItem>
                  <MenuItem onClick={() => navigate({ to: '/analytics' })}>
                    <BarChart3 className="size-3.5" />
                    Portfolio Analytics
                  </MenuItem>
                </MenuGroup>
                <MenuSeparator />
                <MenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="size-3.5" />
                  Sign Out
                </MenuItem>
              </MenuPopup>
            </Menu>
          </div>
        </header>

        {/* Main Body View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />

      {/* Keyboard Shortcuts Dialog (?) */}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </div>
  )
}
