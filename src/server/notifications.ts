import { createServerFn } from '@tanstack/react-start'
import { db, ensureTablesExist } from '@/db'
import { notifications, type Notification, type NotificationType } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// 1. Get all notifications
export const getNotificationsFn = createServerFn({ method: 'GET' }).handler(async (): Promise<{ notifications: Notification[]; unreadCount: number }> => {
  await ensureTablesExist()
  await seedNotificationsIfEmpty()

  const allNotifications = await db.select().from(notifications).orderBy(desc(notifications.createdAt))
  const unreadCount = allNotifications.filter((n) => !n.read).length

  return {
    notifications: allNotifications,
    unreadCount,
  }
})

// 2. Mark notification as read
export const markNotificationReadFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await ensureTablesExist()
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, data.id))
      .returning()
    return updated
  })

// 3. Mark all notifications as read
export const markAllNotificationsReadFn = createServerFn({ method: 'POST' }).handler(async () => {
  await ensureTablesExist()
  await db.update(notifications).set({ read: true })
  return { success: true }
})

// 4. Create new notification
export const createNotificationFn = createServerFn({ method: 'POST' })
  .validator((data: {
    userId?: string
    title: string
    message: string
    type?: NotificationType
    entityType?: 'task' | 'project' | 'item'
    entityId?: string
  }) => data)
  .handler(async ({ data }) => {
    await ensureTablesExist()
    const [inserted] = await db
      .insert(notifications)
      .values({
        userId: data.userId || null,
        title: data.title.trim(),
        message: data.message.trim(),
        type: data.type || 'task_assigned',
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        read: false,
      })
      .returning()
    return inserted
  })

// Seed sample notifications if empty
async function seedNotificationsIfEmpty() {
  const existing = await db.select().from(notifications).limit(1)
  if (existing.length > 0) return

  await db.insert(notifications).values([
    {
      title: 'New Task Assigned',
      message: 'Elena Rostova assigned you to CORE-101: Distributed State Sync & Multi-Region Protocol',
      type: 'task_assigned',
      entityType: 'task',
      entityId: 'CORE-101',
      read: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      title: 'Sprint Health Alert',
      message: 'Global Multi-Region Cloud Infra project health flagged as "At Risk" due to pending replica tests',
      type: 'health_alert',
      entityType: 'project',
      entityId: 'CLOUD',
      read: false,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      title: 'Task Status Updated',
      message: 'Marcus Vance moved UI-201 (Motion Tokens & Micro-Interactions) to Done',
      type: 'status_changed',
      entityType: 'task',
      entityId: 'UI-201',
      read: false,
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
      title: 'Mentioned in Discussion',
      message: 'Liam Chen commented: "@Elena please review the failover latency telemetry"',
      type: 'mention',
      entityType: 'task',
      entityId: 'CLOUD-301',
      read: true,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      title: 'System Milestone Complete',
      message: 'Design System & Component Kit v2 milestone reached 100% completion',
      type: 'system',
      entityType: 'project',
      entityId: 'UI',
      read: true,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
  ])
}
