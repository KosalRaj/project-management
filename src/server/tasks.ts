import { createServerFn } from '@tanstack/react-start'
import { db, ensureTablesExist } from '@/db'
import {
  tasks,
  projects,
  users,
  activityLogs,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
  type CommentItem,
  type AttachmentItem,
  type NotificationPreferences,
} from '@/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { sendEmail, renderTaskAssignedEmail, renderStatusChangeEmail, getAppBaseUrl } from './email-service'

// 1. Get all tasks with optional filters
export const getTasksFn = createServerFn({ method: 'GET' })
  .validator(
    (data?: {
      projectId?: string
      status?: string
      priority?: string
      type?: string
      assigneeId?: string
      search?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()

    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt))

    let result = allTasks

    if (data?.projectId && data.projectId !== 'all') {
      result = result.filter((t) => t.projectId === data.projectId)
    }

    if (data?.status && data.status !== 'all') {
      result = result.filter((t) => t.status === data.status)
    }

    if (data?.priority && data.priority !== 'all') {
      result = result.filter((t) => t.priority === data.priority)
    }

    if (data?.type && data.type !== 'all') {
      result = result.filter((t) => t.type === data.type)
    }

    if (data?.assigneeId && data.assigneeId !== 'all') {
      result = result.filter((t) => t.assigneeId === data.assigneeId)
    }

    if (data?.search && data.search.trim()) {
      const q = data.search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.taskKey.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)),
      )
    }

    return result
  })

// 2. Get single task by ID
export const getTaskByIdFn = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await ensureTablesExist()
    const [task] = await db.select().from(tasks).where(eq(tasks.id, data.id)).limit(1)
    if (!task) {
      throw new Error('Task not found')
    }
    return task
  })

// 3. Create new task
export const createTaskFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      projectId: string
      title: string
      description?: string
      status?: TaskStatus
      priority?: TaskPriority
      type?: TaskType
      estimatePoints?: number | null
      assigneeId?: string
      assigneeName?: string
      assigneeAvatar?: string
      dueDate?: string
      labels?: string[]
      subtasks?: { id: string; title: string; completed: boolean }[]
      attachments?: AttachmentItem[]
    }) => {
      if (!data.title || data.title.trim().length === 0) throw new Error('Task title is required')
      if (!data.projectId) throw new Error('Project ID is required')
      return data
    },
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()

    // 1. Fetch project to get key
    const [project] = await db.select().from(projects).where(eq(projects.id, data.projectId)).limit(1)
    if (!project) {
      throw new Error('Project not found')
    }

    // 2. Find max task number for this project
    const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, data.projectId))
    const maxNumber = projectTasks.reduce((max, t) => Math.max(max, t.taskNumber || 0), 100)
    const nextNumber = maxNumber + 1
    const taskKey = `${project.key}-${nextNumber}`

    const [newTask] = await db
      .insert(tasks)
      .values({
        taskNumber: nextNumber,
        taskKey,
        projectId: data.projectId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        type: data.type || 'feature',
        estimatePoints: data.estimatePoints || null,
        assigneeId: data.assigneeId || null,
        assigneeName: data.assigneeName || null,
        assigneeAvatar: data.assigneeAvatar || null,
        dueDate: data.dueDate || null,
        labels: JSON.stringify(data.labels || []),
        subtasks: JSON.stringify(data.subtasks || []),
        comments: JSON.stringify([]),
        attachments: JSON.stringify(data.attachments || []),
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning()

    // Log activity
    try {
      await db.insert(activityLogs).values({
        userName: data.assigneeName || 'Team Member',
        userAvatar: data.assigneeAvatar || null,
        action: 'created',
        entityType: 'task',
        entityId: taskKey,
        entityTitle: newTask.title,
        details: `Created task ${taskKey} in ${project.name}`,
      })
    } catch (_) {}

    // Dispatch assignment email if assigned to a user
    if (newTask.assigneeId) {
      ;(async () => {
        try {
          const [assignee] = await db.select().from(users).where(eq(users.id, newTask.assigneeId!))
          if (assignee?.email) {
            const prefs: NotificationPreferences = assignee.notificationPreferences
              ? JSON.parse(assignee.notificationPreferences)
              : { notifyOnTaskAssigned: true, notifyOnStatusChange: true, notifyOnHealthAlert: true, notifyOnMention: true }

            if (prefs.notifyOnTaskAssigned) {
              const appUrl = getAppBaseUrl()
              const taskUrl = `${appUrl}/projects/${project.id}`
              const { html, text } = renderTaskAssignedEmail(
                assignee.name,
                newTask,
                project,
                'A team member',
                taskUrl,
              )
              await sendEmail({
                to: assignee.email,
                toName: assignee.name,
                subject: `[Assigned] [${newTask.taskKey}] ${newTask.title}`,
                templateType: 'task_assigned',
                html,
                text,
                metadata: { taskId: newTask.id, projectId: project.id },
              })
            }
          }
        } catch (err) {
          console.error('Failed to send task assignment email:', err)
        }
      })()
    }

    return newTask
  })

// 4. Update task
export const updateTaskFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      id: string
      title?: string
      description?: string
      status?: TaskStatus
      priority?: TaskPriority
      type?: TaskType
      estimatePoints?: number | null
      assigneeId?: string | null
      assigneeName?: string | null
      assigneeAvatar?: string | null
      dueDate?: string | null
      labels?: string[]
      subtasks?: { id: string; title: string; completed: boolean }[]
      comments?: any[]
      attachments?: AttachmentItem[]
    }) => data,
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()

    // Fetch existing task for comparison
    const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, data.id)).limit(1)

    const { id, labels, subtasks, comments, attachments, ...rest } = data

    const updates: Record<string, any> = {
      ...rest,
      updatedAt: new Date().toISOString(),
    }

    if (labels !== undefined) {
      updates.labels = JSON.stringify(labels)
    }
    if (subtasks !== undefined) {
      updates.subtasks = JSON.stringify(subtasks)
    }
    if (comments !== undefined) {
      updates.comments = JSON.stringify(comments)
    }
    if (attachments !== undefined) {
      updates.attachments = JSON.stringify(attachments)
    }

    const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning()

    // Log status change activity
    if (data.status && updated) {
      try {
        await db.insert(activityLogs).values({
          userName: updated.assigneeName || 'Team Member',
          userAvatar: updated.assigneeAvatar || null,
          action: 'updated_status',
          entityType: 'task',
          entityId: updated.taskKey,
          entityTitle: updated.title,
          details: `Shifted stage to ${data.status.replace('_', ' ')}`,
        })
      } catch (_) {}
    }

    // Trigger transactional emails asynchronously
    if (updated) {
      ;(async () => {
        try {
          const [project] = await db.select().from(projects).where(eq(projects.id, updated.projectId)).limit(1)
          const appUrl = getAppBaseUrl()
          const taskUrl = `${appUrl}/projects/${updated.projectId}`

          // 1. Assignee changed notification
          if (data.assigneeId && data.assigneeId !== existingTask?.assigneeId) {
            const [assignee] = await db.select().from(users).where(eq(users.id, data.assigneeId))
            if (assignee?.email) {
              const prefs: NotificationPreferences = assignee.notificationPreferences
                ? JSON.parse(assignee.notificationPreferences)
                : { notifyOnTaskAssigned: true, notifyOnStatusChange: true, notifyOnHealthAlert: true, notifyOnMention: true }

              if (prefs.notifyOnTaskAssigned) {
                const { html, text } = renderTaskAssignedEmail(
                  assignee.name,
                  updated,
                  project || { name: 'Project', key: 'PROJ' },
                  'A team member',
                  taskUrl,
                )
                await sendEmail({
                  to: assignee.email,
                  toName: assignee.name,
                  subject: `[Assigned] [${updated.taskKey}] ${updated.title}`,
                  templateType: 'task_assigned',
                  html,
                  text,
                  metadata: { taskId: updated.id, projectId: updated.projectId },
                })
              }
            }
          }

          // 2. Status change notification
          if (data.status && existingTask && data.status !== existingTask.status && updated.assigneeId) {
            const [assignee] = await db.select().from(users).where(eq(users.id, updated.assigneeId))
            if (assignee?.email) {
              const prefs: NotificationPreferences = assignee.notificationPreferences
                ? JSON.parse(assignee.notificationPreferences)
                : { notifyOnTaskAssigned: true, notifyOnStatusChange: true, notifyOnHealthAlert: true, notifyOnMention: true }

              if (prefs.notifyOnStatusChange) {
                const { html, text } = renderStatusChangeEmail(
                  assignee.name,
                  updated,
                  existingTask.status,
                  data.status,
                  'A team member',
                  taskUrl,
                )
                await sendEmail({
                  to: assignee.email,
                  toName: assignee.name,
                  subject: `[Status Update] [${updated.taskKey}] ${updated.title}`,
                  templateType: 'status_changed',
                  html,
                  text,
                  metadata: { taskId: updated.id, oldStatus: existingTask.status, newStatus: data.status },
                })
              }
            }
          }
        } catch (err) {
          console.error('Error sending task event notification emails:', err)
        }
      })()
    }

    return updated
  })

// 5. Delete task
export const deleteTaskFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await ensureTablesExist()
    await db.delete(tasks).where(eq(tasks.id, data.id))
    return { success: true }
  })

// 6. Batch update tasks
export const batchUpdateTasksFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      ids: string[]
      action: 'status' | 'priority' | 'delete'
      value?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()

    if (data.ids.length === 0) return { success: true, count: 0 }

    if (data.action === 'delete') {
      await db.delete(tasks).where(inArray(tasks.id, data.ids))
      return { success: true, count: data.ids.length }
    }

    if (data.action === 'status' && data.value) {
      await db
        .update(tasks)
        .set({ status: data.value as TaskStatus, updatedAt: new Date().toISOString() })
        .where(inArray(tasks.id, data.ids))
      return { success: true, count: data.ids.length }
    }

    if (data.action === 'priority' && data.value) {
      await db
        .update(tasks)
        .set({ priority: data.value as TaskPriority, updatedAt: new Date().toISOString() })
        .where(inArray(tasks.id, data.ids))
      return { success: true, count: data.ids.length }
    }

    return { success: true, count: data.ids.length }
  })

// 7. Add comment to task
export const addCommentToTaskFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      taskId: string
      authorName: string
      authorAvatar?: string
      content: string
    }) => {
      if (!data.content || data.content.trim().length === 0) throw new Error('Comment content cannot be empty')
      return data
    },
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()
    const [task] = await db.select().from(tasks).where(eq(tasks.id, data.taskId)).limit(1)
    if (!task) throw new Error('Task not found')

    let comments: CommentItem[] = []
    try {
      const parsed = JSON.parse(task.comments || '[]')
      comments = Array.isArray(parsed) ? parsed : []
    } catch {
      comments = []
    }

    const newComment: CommentItem = {
      id: crypto.randomUUID(),
      authorName: data.authorName,
      authorAvatar: data.authorAvatar,
      content: data.content.trim(),
      createdAt: new Date().toISOString(),
    }

    comments.push(newComment)

    const [updated] = await db
      .update(tasks)
      .set({
        comments: JSON.stringify(comments),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, data.taskId))
      .returning()

    return updated
  })
