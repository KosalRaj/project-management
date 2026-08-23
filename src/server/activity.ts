import { createServerFn } from '@tanstack/react-start'
import { db, ensureTablesExist } from '@/db'
import { activityLogs, type ActivityLog } from '@/db/schema'
import { desc } from 'drizzle-orm'

// 1. Get recent activity logs
export const getActivityLogsFn = createServerFn({ method: 'GET' })
  .validator((data?: { entityType?: string; entityId?: string; limit?: number }) => data)
  .handler(async ({ data }): Promise<ActivityLog[]> => {
    await ensureTablesExist()
    await seedActivityIfEmpty()

    let query = db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(data?.limit || 50)
    const logs = await query

    if (data?.entityType && data?.entityId) {
      return logs.filter((l) => l.entityType === data.entityType && l.entityId === data.entityId)
    }

    return logs
  })

// 2. Record an activity log
export const recordActivityFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      userId?: string
      userName: string
      userAvatar?: string
      action: 'created' | 'updated_status' | 'commented' | 'assigned' | 'deleted'
      entityType: 'task' | 'project' | 'user'
      entityId: string
      entityTitle: string
      details?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()
    const [inserted] = await db
      .insert(activityLogs)
      .values({
        userId: data.userId || null,
        userName: data.userName,
        userAvatar: data.userAvatar || null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityTitle: data.entityTitle,
        details: data.details || null,
      })
      .returning()
    return inserted
  })

// Seed sample activity logs if empty
async function seedActivityIfEmpty() {
  const existing = await db.select().from(activityLogs).limit(1)
  if (existing.length > 0) return

  await db.insert(activityLogs).values([
    {
      userName: 'Elena Rostova',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      action: 'created',
      entityType: 'task',
      entityId: 'CORE-101',
      entityTitle: 'Distributed State Sync & Multi-Region Protocol',
      details: 'Created task with 8 story points in Backlog',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      userName: 'Marcus Vance',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      action: 'updated_status',
      entityType: 'task',
      entityId: 'UI-201',
      entityTitle: 'Motion Tokens & Micro-Interactions Integration',
      details: 'Shifted stage from In Progress to Done',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      userName: 'Liam Chen',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      action: 'commented',
      entityType: 'task',
      entityId: 'CLOUD-301',
      entityTitle: 'Configure automated disaster recovery failover',
      details: 'Added discussion comment with telemetry latency graph',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    },
    {
      userName: 'Sophia Zhang',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      action: 'assigned',
      entityType: 'task',
      entityId: 'CORE-102',
      entityTitle: 'Harden cryptographic PBKDF2 salt rotation',
      details: 'Assigned to Elena Rostova',
      createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    },
  ])
}
