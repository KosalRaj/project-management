import { createServerFn } from '@tanstack/react-start'
import { eq, desc, inArray } from 'drizzle-orm'
import { db } from '../db'
import { items, type Item, type ItemCategory, type ItemPriority, type ItemStatus } from '../db/schema'

export const getItemsFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    return await db.select().from(items).orderBy(desc(items.createdAt))
  } catch (error) {
    console.error('Failed to fetch items from Turso:', error)
    return []
  }
})

export const createItemFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      title: string
      description?: string
      status?: ItemStatus
      priority?: ItemPriority
      category?: ItemCategory
      assigneeName?: string
      assigneeAvatar?: string
      dueDate?: string
      progress?: number
      budget?: number
      tags?: string
    }) => {
      if (!data.title || data.title.trim().length === 0) {
        throw new Error('Title is required')
      }
      return data
    },
  )
  .handler(async ({ data }) => {
    const isCompleted = data.status === 'completed' || (data.progress !== undefined && data.progress >= 100)
    const [inserted] = await db
      .insert(items)
      .values({
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: data.status || 'backlog',
        priority: data.priority || 'medium',
        category: data.category || 'engineering',
        assigneeName: data.assigneeName?.trim() || 'Alex Rivera',
        assigneeAvatar: data.assigneeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        progress: data.progress ?? 0,
        budget: data.budget ?? 0,
        completed: isCompleted,
        tags: data.tags || '[]',
      })
      .returning()
    return inserted
  })

export const updateItemFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      id: string
      title?: string
      description?: string | null
      status?: ItemStatus
      priority?: ItemPriority
      category?: ItemCategory
      assigneeName?: string | null
      assigneeAvatar?: string | null
      dueDate?: string | null
      progress?: number
      budget?: number
      completed?: boolean
      tags?: string
    }) => {
      if (!data.id) {
        throw new Error('Item ID is required')
      }
      return data
    },
  )
  .handler(async ({ data }) => {
    const updatePayload: Partial<Item> = {
      updatedAt: new Date().toISOString(),
    }

    if (data.title !== undefined) updatePayload.title = data.title.trim()
    if (data.description !== undefined) updatePayload.description = data.description?.trim() || null
    if (data.status !== undefined) {
      updatePayload.status = data.status
      if (data.status === 'completed' && data.completed === undefined) {
        updatePayload.completed = true
        updatePayload.progress = 100
      } else if (data.status !== 'completed' && data.completed === undefined && data.progress === 100) {
        updatePayload.progress = 90
        updatePayload.completed = false
      }
    }
    if (data.priority !== undefined) updatePayload.priority = data.priority
    if (data.category !== undefined) updatePayload.category = data.category
    if (data.assigneeName !== undefined) updatePayload.assigneeName = data.assigneeName?.trim() || null
    if (data.assigneeAvatar !== undefined) updatePayload.assigneeAvatar = data.assigneeAvatar || null
    if (data.dueDate !== undefined) updatePayload.dueDate = data.dueDate || null
    if (data.progress !== undefined) {
      updatePayload.progress = Math.min(100, Math.max(0, data.progress))
      if (updatePayload.progress === 100) {
        updatePayload.completed = true
        updatePayload.status = 'completed'
      } else if (data.completed === undefined && updatePayload.status === 'completed' && updatePayload.progress < 100) {
        updatePayload.completed = false
        updatePayload.status = 'in_progress'
      }
    }
    if (data.budget !== undefined) updatePayload.budget = data.budget
    if (data.completed !== undefined) {
      updatePayload.completed = data.completed
      if (data.completed) {
        updatePayload.status = 'completed'
        updatePayload.progress = 100
      } else if (updatePayload.status === 'completed') {
        updatePayload.status = 'in_progress'
        updatePayload.progress = 50
      }
    }
    if (data.tags !== undefined) updatePayload.tags = data.tags

    const [updated] = await db
      .update(items)
      .set(updatePayload)
      .where(eq(items.id, data.id))
      .returning()
    return updated
  })

export const toggleItemFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; completed: boolean }) => data)
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(items)
      .set({
        completed: data.completed,
        status: data.completed ? 'completed' : 'in_progress',
        progress: data.completed ? 100 : 50,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(items.id, data.id))
      .returning()
    return updated
  })

export const deleteItemFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await db.delete(items).where(eq(items.id, data.id))
    return { success: true, id: data.id }
  })

export const duplicateItemFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const [original] = await db.select().from(items).where(eq(items.id, data.id))
    if (!original) {
      throw new Error('Item not found')
    }

    const [duplicated] = await db
      .insert(items)
      .values({
        title: `${original.title} (Copy)`,
        description: original.description,
        status: original.status,
        priority: original.priority,
        category: original.category,
        assigneeName: original.assigneeName,
        assigneeAvatar: original.assigneeAvatar,
        dueDate: original.dueDate,
        progress: original.progress,
        budget: original.budget,
        completed: original.completed,
        tags: original.tags,
      })
      .returning()
    return duplicated
  })

export const batchUpdateItemsFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      ids: string[]
      updates: {
        status?: ItemStatus
        priority?: ItemPriority
        category?: ItemCategory
        completed?: boolean
      }
    }) => {
      if (!data.ids || data.ids.length === 0) {
        throw new Error('No items selected')
      }
      return data
    },
  )
  .handler(async ({ data }) => {
    const updatePayload: Partial<Item> = {
      updatedAt: new Date().toISOString(),
    }

    if (data.updates.status) {
      updatePayload.status = data.updates.status
      if (data.updates.status === 'completed') {
        updatePayload.completed = true
        updatePayload.progress = 100
      }
    }
    if (data.updates.priority) updatePayload.priority = data.updates.priority
    if (data.updates.category) updatePayload.category = data.updates.category
    if (data.updates.completed !== undefined) {
      updatePayload.completed = data.updates.completed
      if (data.updates.completed) {
        updatePayload.status = 'completed'
        updatePayload.progress = 100
      }
    }

    await db.update(items).set(updatePayload).where(inArray(items.id, data.ids))
    return { success: true, count: data.ids.length }
  })

export const batchDeleteItemsFn = createServerFn({ method: 'POST' })
  .validator((data: { ids: string[] }) => {
    if (!data.ids || data.ids.length === 0) {
      throw new Error('No items selected')
    }
    return data
  })
  .handler(async ({ data }) => {
    await db.delete(items).where(inArray(items.id, data.ids))
    return { success: true, count: data.ids.length }
  })

export const seedDemoDataFn = createServerFn({ method: 'POST' }).handler(async () => {
  const sampleItems = [
    {
      title: 'Architect Realtime WebSocket Sync Engine',
      description: 'Implement bi-directional event client and CRDT synchronization for multi-user collaboration.',
      status: 'in_progress' as ItemStatus,
      priority: 'urgent' as ItemPriority,
      category: 'engineering' as ItemCategory,
      assigneeName: 'Elena Rostova',
      assigneeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      progress: 65,
      budget: 12500,
      completed: false,
      tags: JSON.stringify(['Core', 'Architecture', 'WebSockets']),
    },
    {
      title: 'Design System & Token Architecture v2',
      description: 'Create unified color palettes, fluid typography, and dark-mode elevation tokens in Tailwind v4.',
      status: 'completed' as ItemStatus,
      priority: 'high' as ItemPriority,
      category: 'design' as ItemCategory,
      assigneeName: 'Marcus Vance',
      assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      progress: 100,
      budget: 8400,
      completed: true,
      tags: JSON.stringify(['Design', 'Tokens', 'Tailwind']),
    },
    {
      title: 'Q3 Enterprise Product Launch Campaign',
      description: 'Coordinate global press release, developer community outreach, and interactive playground demos.',
      status: 'in_review' as ItemStatus,
      priority: 'high' as ItemPriority,
      category: 'marketing' as ItemCategory,
      assigneeName: 'Aisha Patel',
      assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      progress: 85,
      budget: 18000,
      completed: false,
      tags: JSON.stringify(['Marketing', 'Launch', 'Community']),
    },
    {
      title: 'Global Edge Cache & Cloudflare CDN Tuning',
      description: 'Optimize cache headers, KV storage lookups, and SSL latency across 280+ edge locations.',
      status: 'in_progress' as ItemStatus,
      priority: 'medium' as ItemPriority,
      category: 'operations' as ItemCategory,
      assigneeName: 'Liam Chen',
      assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      dueDate: new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0],
      progress: 40,
      budget: 6200,
      completed: false,
      tags: JSON.stringify(['Edge', 'Cloudflare', 'Performance']),
    },
    {
      title: 'Annual SaaS ARR & Cost Optimization Audit',
      description: 'Audit cloud infrastructure costs, compute utilization, and subscription tier profitability.',
      status: 'backlog' as ItemStatus,
      priority: 'medium' as ItemPriority,
      category: 'finance' as ItemCategory,
      assigneeName: 'Sophia Zhang',
      assigneeAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      progress: 10,
      budget: 9500,
      completed: false,
      tags: JSON.stringify(['Finance', 'Audit', 'Analytics']),
    },
    {
      title: 'Zero-Trust Role-Based Access Control (RBAC)',
      description: 'Implement fine-grained permissions, JWT rotation, and audit log streaming for enterprise teams.',
      status: 'in_progress' as ItemStatus,
      priority: 'urgent' as ItemPriority,
      category: 'engineering' as ItemCategory,
      assigneeName: 'Elena Rostova',
      assigneeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      progress: 55,
      budget: 15000,
      completed: false,
      tags: JSON.stringify(['Security', 'Auth', 'RBAC']),
    },
    {
      title: 'Interactive Data Visualizations & Chart Engine',
      description: 'Build animated Canvas and SVG charts for metrics, revenue projection, and team throughput.',
      status: 'in_review' as ItemStatus,
      priority: 'medium' as ItemPriority,
      category: 'design' as ItemCategory,
      assigneeName: 'Marcus Vance',
      assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      dueDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
      progress: 90,
      budget: 7800,
      completed: false,
      tags: JSON.stringify(['Charts', 'UI/UX', 'BaseUI']),
    },
    {
      title: 'Automated Disaster Recovery & Backup Pipelines',
      description: 'Configure multi-region failover tests, point-in-time recovery, and encrypted backup snapshots.',
      status: 'backlog' as ItemStatus,
      priority: 'low' as ItemPriority,
      category: 'operations' as ItemCategory,
      assigneeName: 'Liam Chen',
      assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      dueDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      progress: 0,
      budget: 4500,
      completed: false,
      tags: JSON.stringify(['DevOps', 'Backups', 'Resilience']),
    },
  ]

  // Insert seed items
  for (const item of sampleItems) {
    await db.insert(items).values(item)
  }

  return { success: true, count: sampleItems.length }
})