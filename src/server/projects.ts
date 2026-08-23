import { createServerFn } from '@tanstack/react-start'
import { db, ensureTablesExist } from '@/db'
import { projects, tasks, items, type Project, type ProjectStatus, type ProjectHealth } from '@/db/schema'
import { seedDemoDataFn } from './items'
import { eq, desc } from 'drizzle-orm'
import { requireAuthUser } from './auth-helpers'

export interface ProjectWithStats extends Project {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  progress: number
}

// 1. Get all projects with aggregated task metrics
export const getProjectsFn = createServerFn({ method: 'GET' }).handler(async (): Promise<ProjectWithStats[]> => {
  await ensureTablesExist()

  const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt))
  const allTasks = await db.select().from(tasks)

  return allProjects.map((proj) => {
    const projTasks = allTasks.filter((t) => t.projectId === proj.id)
    const totalTasks = projTasks.length
    const completedTasks = projTasks.filter((t) => t.status === 'done').length
    const inProgressTasks = projTasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      ...proj,
      totalTasks,
      completedTasks,
      inProgressTasks,
      progress,
    }
  })
})

// 2. Get single project by ID
export const getProjectByIdFn = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await ensureTablesExist()
    const [project] = await db.select().from(projects).where(eq(projects.id, data.id)).limit(1)
    if (!project) {
      throw new Error('Project not found')
    }

    const projTasks = await db.select().from(tasks).where(eq(tasks.projectId, data.id))
    const totalTasks = projTasks.length
    const completedTasks = projTasks.filter((t) => t.status === 'done').length
    const inProgressTasks = projTasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      ...project,
      totalTasks,
      completedTasks,
      inProgressTasks,
      progress,
    } as ProjectWithStats
  })

// 3. Create new project
export const createProjectFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      key: string
      name: string
      description?: string
      icon?: string
      color?: string
      status?: ProjectStatus
      health?: ProjectHealth
      leadId?: string
      leadName?: string
      leadAvatar?: string
      startDate?: string
      targetDate?: string
      budget?: number
    }) => {
      if (!data.name || data.name.trim().length === 0) throw new Error('Project name is required')
      if (!data.key || data.key.trim().length === 0) throw new Error('Project key is required')
      return data
    },
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()

    const projectKey = data.key.trim().toUpperCase()

    // Check key uniqueness
    const existing = await db.select().from(projects).where(eq(projects.key, projectKey)).limit(1)
    if (existing.length > 0) {
      throw new Error(`Project key "${projectKey}" already exists. Please choose a unique key.`)
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        key: projectKey,
        name: data.name.trim(),
        description: data.description || null,
        icon: data.icon || 'Folder',
        color: data.color || 'sky',
        status: data.status || 'active',
        health: data.health || 'on_track',
        leadId: data.leadId || null,
        leadName: data.leadName || null,
        leadAvatar: data.leadAvatar || null,
        startDate: data.startDate || null,
        targetDate: data.targetDate || null,
        budget: data.budget || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning()

    return newProject
  })

// 4. Update project
export const updateProjectFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      id: string
      name?: string
      description?: string
      icon?: string
      color?: string
      status?: ProjectStatus
      health?: ProjectHealth
      leadId?: string
      leadName?: string
      leadAvatar?: string
      startDate?: string
      targetDate?: string
      budget?: number
    }) => data,
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()
    const { id, ...updates } = data

    const [updated] = await db
      .update(projects)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, id))
      .returning()

    return updated
  })

// 5. Delete project (Admin only)
export const deleteProjectFn = createServerFn({ method: 'POST' })
  .validator((data: { token?: string; id: string }) => data)
  .handler(async ({ data }) => {
    await ensureTablesExist()
    await requireAuthUser(data.token, ['admin'])

    await db.delete(tasks).where(eq(tasks.projectId, data.id))
    await db.delete(projects).where(eq(projects.id, data.id))
    return { success: true }
  })

// Helper: Seed projects and sample tasks if table is empty
async function seedProjectsAndTasksIfEmpty() {
  const existing = await db.select().from(projects).limit(1)
  if (existing.length > 0) return

  const [p1] = await db
    .insert(projects)
    .values({
      key: 'CORE',
      name: 'Next-Gen Core Engine 2.0',
      description: 'Distributed synchronization pipeline, high-throughput RPC caching, and zero-trust identity protocols.',
      icon: 'Cpu',
      color: 'sky',
      status: 'active',
      health: 'on_track',
      leadName: 'Elena Rostova',
      leadAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      startDate: '2026-07-01',
      targetDate: '2026-10-31',
      budget: 185000,
    })
    .returning()

  const [p2] = await db
    .insert(projects)
    .values({
      key: 'UI',
      name: 'Design System & Component Kit',
      description: 'Accessible WCAG 2.1 AAA Coss UI particle components, motion tokens, and dark/light adaptive tokens.',
      icon: 'Palette',
      color: 'violet',
      status: 'active',
      health: 'on_track',
      leadName: 'Marcus Vance',
      leadAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      startDate: '2026-06-15',
      targetDate: '2026-09-30',
      budget: 95000,
    })
    .returning()

  const [p3] = await db
    .insert(projects)
    .values({
      key: 'CLOUD',
      name: 'Global Multi-Region Cloud Infra',
      description: 'Zero-downtime database replication across us-east, eu-central, and ap-southeast edges.',
      icon: 'Cloud',
      color: 'emerald',
      status: 'active',
      health: 'at_risk',
      leadName: 'Liam Chen',
      leadAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      startDate: '2026-05-01',
      targetDate: '2026-11-15',
      budget: 240000,
    })
    .returning()

  await db
    .insert(projects)
    .values({
      key: 'APP',
      name: 'Mobile & Tablet Native Client',
      description: 'Cross-platform native companion app with offline synchronization and biometric auth.',
      icon: 'Smartphone',
      color: 'amber',
      status: 'planning',
      health: 'on_track',
      leadName: 'Aisha Patel',
      leadAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      startDate: '2026-09-01',
      targetDate: '2026-12-20',
      budget: 120000,
    })

  // Seed tasks for CORE project
  await db.insert(tasks).values([
    {
      taskNumber: 101,
      taskKey: 'CORE-101',
      projectId: p1.id,
      title: 'Architect distributed message bus using libSQL WAL stream',
      description: 'Implement real-time sync mechanism for multi-tenant workspace updates with automatic conflict resolution.',
      status: 'in_progress',
      priority: 'urgent',
      type: 'feature',
      estimatePoints: 8,
      assigneeName: 'Elena Rostova',
      assigneeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      dueDate: '2026-08-30',
      labels: JSON.stringify(['backend', 'architecture', 'p0']),
      subtasks: JSON.stringify([
        { id: 'st-1', title: 'Define protocol buffer specs', completed: true },
        { id: 'st-2', title: 'Benchmark WAL subscriber latency', completed: true },
        { id: 'st-3', title: 'Write integration failover tests', completed: false },
      ]),
      comments: JSON.stringify([
        {
          id: 'c-1',
          authorName: 'Elena Rostova',
          authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          content: 'Preliminary benchmarks show sub-12ms roundtrips on Turso serverless edge nodes.',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
      ]),
    },
    {
      taskNumber: 102,
      taskKey: 'CORE-102',
      projectId: p1.id,
      title: 'Harden cryptographic PBKDF2 salt rotation & session telemetry',
      description: 'Enforce rate-limiting on brute-force attempts and add hardware security key WebAuthn support.',
      status: 'done',
      priority: 'high',
      type: 'improvement',
      estimatePoints: 5,
      assigneeName: 'Elena Rostova',
      assigneeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      dueDate: '2026-08-22',
      labels: JSON.stringify(['security', 'auth']),
      subtasks: JSON.stringify([
        { id: 'st-4', title: 'Audit constant-time comparisons', completed: true },
        { id: 'st-5', title: 'Verify token expiration middleware', completed: true },
      ]),
    },
    {
      taskNumber: 103,
      taskKey: 'CORE-103',
      projectId: p1.id,
      title: 'Fix memory leak in background worker task pool during burst RPCs',
      description: 'Garbage collection pressure increases when processing batch uploads exceeding 10k items.',
      status: 'in_review',
      priority: 'urgent',
      type: 'bug',
      estimatePoints: 3,
      assigneeName: 'Liam Chen',
      assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      dueDate: '2026-08-25',
      labels: JSON.stringify(['bug', 'performance']),
      subtasks: JSON.stringify([
        { id: 'st-6', title: 'Profile memory heap dump with Chrome DevTools', completed: true },
        { id: 'st-7', title: 'Replace unbounded array buffers with ring buffer', completed: true },
      ]),
    },
    {
      taskNumber: 104,
      taskKey: 'CORE-104',
      projectId: p1.id,
      title: 'Draft OpenAPI 3.1 schema and automated client SDK generator',
      description: 'Expose typed client SDKs for TypeScript, Python, and Go microservices.',
      status: 'todo',
      priority: 'medium',
      type: 'feature',
      estimatePoints: 5,
      assigneeName: 'Aisha Patel',
      assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      dueDate: '2026-09-10',
      labels: JSON.stringify(['api', 'developer-experience']),
      subtasks: JSON.stringify([]),
    },
    {
      taskNumber: 105,
      taskKey: 'CORE-105',
      projectId: p1.id,
      title: 'Add support for custom webhook endpoints with HMAC-SHA256 signature verification',
      description: 'Allow external systems to subscribe to issue creation, assignment, and status transitions.',
      status: 'backlog',
      priority: 'low',
      type: 'feature',
      estimatePoints: 3,
      assigneeName: 'Marcus Vance',
      assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      dueDate: '2026-09-28',
      labels: JSON.stringify(['integrations']),
      subtasks: JSON.stringify([]),
    },
  ])

  // Seed tasks for UI project
  await db.insert(tasks).values([
    {
      taskNumber: 201,
      taskKey: 'UI-201',
      projectId: p2.id,
      title: 'Build command palette (Cmd+K) with fuzzy search across projects and issues',
      description: 'Provide instant navigation, hotkey execution, and recent items jump list.',
      status: 'in_progress',
      priority: 'high',
      type: 'feature',
      estimatePoints: 5,
      assigneeName: 'Marcus Vance',
      assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      dueDate: '2026-09-05',
      labels: JSON.stringify(['ui', 'accessibility', 'ux']),
      subtasks: JSON.stringify([
        { id: 'st-8', title: 'Implement keyboard event listeners', completed: true },
        { id: 'st-9', title: 'Index search queries with scoring algorithm', completed: false },
      ]),
    },
    {
      taskNumber: 202,
      taskKey: 'UI-202',
      projectId: p2.id,
      title: 'Tune Transitions.dev motion tokens on dialogs and dropdown menus',
      description: 'Ensure open/close asymmetry (250ms -> 150ms) and spring returns on hover states.',
      status: 'done',
      priority: 'medium',
      type: 'improvement',
      estimatePoints: 2,
      assigneeName: 'Marcus Vance',
      assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      dueDate: '2026-08-21',
      labels: JSON.stringify(['design-system', 'motion']),
      subtasks: JSON.stringify([
        { id: 'st-10', title: 'Audit 5 motion dimensions', completed: true },
      ]),
    },
    {
      taskNumber: 203,
      taskKey: 'UI-203',
      projectId: p2.id,
      title: 'Support virtualized list rendering for datasets exceeding 50,000 tasks',
      description: 'Use windowing technique to keep DOM node count low on large enterprise tables.',
      status: 'todo',
      priority: 'high',
      type: 'improvement',
      estimatePoints: 8,
      assigneeName: 'Elena Rostova',
      assigneeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      dueDate: '2026-09-18',
      labels: JSON.stringify(['performance', 'frontend']),
      subtasks: JSON.stringify([]),
    },
  ])

  // Seed tasks for CLOUD project
  await db.insert(tasks).values([
    {
      taskNumber: 301,
      taskKey: 'CLOUD-301',
      projectId: p3.id,
      title: 'Configure automated disaster recovery failover to EU-Central replica',
      description: 'Target recovery point objective (RPO) < 1 minute and recovery time objective (RTO) < 30 seconds.',
      status: 'in_progress',
      priority: 'urgent',
      type: 'feature',
      estimatePoints: 8,
      assigneeName: 'Liam Chen',
      assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      dueDate: '2026-09-02',
      labels: JSON.stringify(['devops', 'cloud', 'reliability']),
      subtasks: JSON.stringify([
        { id: 'st-11', title: 'Set up cross-region replication stream', completed: true },
        { id: 'st-12', title: 'Simulate primary node outage in staging', completed: false },
      ]),
    },
  ])
}

// 8. Reset and re-seed sample workspace (Admin only)
export const resetAndSeedWorkspaceFn = createServerFn({ method: 'POST' })
  .validator((data?: { token?: string }) => data)
  .handler(async ({ data }) => {
    await ensureTablesExist()
    await requireAuthUser(data?.token, ['admin'])

    // Clean existing tasks, projects, items
    await db.delete(tasks)
    await db.delete(projects)
    await db.delete(items)

    // Seed sample items
    await seedDemoDataFn()
    // Seed sample projects and tasks
    await seedProjectsAndTasksIfEmpty()

    return { success: true }
  })

