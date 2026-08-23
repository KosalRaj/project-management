import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Menu,
  MenuTrigger,
  MenuPopup,
} from '@/components/ui/menu'
import { Badge } from '@/components/ui/badge'
import {
  getNotificationsFn,
  markNotificationReadFn,
  markAllNotificationsReadFn,
} from '@/server/notifications'
import type { Notification } from '@/db/schema'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Users,
  Layers,
  Sparkles,
  CheckCheck,
  Clock,
} from 'lucide-react'

export function NotificationCenter() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const loadNotifications = async () => {
    try {
      const res = await getNotificationsFn()
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await markAllNotificationsReadFn()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      try {
        await markNotificationReadFn({ data: { id: notif.id } })
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch (err) {
        console.error('Failed to mark read:', err)
      }
    }

    // Navigate to target entity if available
    if (notif.entityType === 'task') {
      navigate({ to: '/tasks' })
    } else if (notif.entityType === 'project') {
      navigate({ to: '/projects' })
    }
  }

  const filteredNotifications = tab === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <Users className="size-3.5 text-blue-500" />
      case 'status_changed':
        return <CheckCircle2 className="size-3.5 text-emerald-500" />
      case 'health_alert':
        return <AlertTriangle className="size-3.5 text-amber-500" />
      case 'mention':
        return <Sparkles className="size-3.5 text-purple-500" />
      default:
        return <Layers className="size-3.5 text-primary" />
    }
  }

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Recently'
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <Menu>
      <MenuTrigger
        aria-label="Open notifications center"
        className="relative flex size-9 items-center justify-center rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/70 hover:border-border transition-all cursor-pointer text-muted-foreground hover:text-foreground"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </MenuTrigger>

      <MenuPopup align="end" className="w-80 sm:w-96 p-0 overflow-hidden shadow-2xl border-border/80">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-foreground">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-bold border-primary/30 bg-primary/10 text-primary">
                {unreadCount} new
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/40 bg-muted/20 text-xs">
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              tab === 'all'
                ? 'bg-background shadow-xs text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('unread')}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              tab === 'unread'
                ? 'bg-background shadow-xs text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
              <Bell className="size-6 mx-auto text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">All caught up!</p>
              <p className="text-[11px]">No unread alerts or notifications.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                  notif.read ? 'bg-card hover:bg-muted/40' : 'bg-primary/5 hover:bg-primary/10'
                }`}
              >
                <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 border border-border/50 shrink-0 mt-0.5">
                  {getTypeIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs truncate ${notif.read ? 'font-medium text-foreground/90' : 'font-bold text-foreground'}`}>
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                      <Clock className="size-2.5" />
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {!notif.read && (
                  <span className="size-2 rounded-full bg-primary shrink-0 self-center" />
                )}
              </div>
            ))
          )}
        </div>
      </MenuPopup>
    </Menu>
  )
}
