import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const items = sqliteTable('items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('backlog'),
  priority: text('priority').notNull().default('medium'),
  category: text('category').notNull().default('engineering'),
  assigneeName: text('assignee_name'),
  assigneeAvatar: text('assignee_avatar'),
  dueDate: text('due_date'),
  progress: integer('progress').notNull().default(0),
  budget: integer('budget').notNull().default(0),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  tags: text('tags').notNull().default('[]'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
})

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('member'), // 'admin' | 'manager' | 'member' | 'guest'
  status: text('status').notNull().default('active'), // 'active' | 'inactive' | 'suspended'
  avatar: text('avatar'),
  title: text('title'),
  department: text('department'),
  lastLoginAt: text('last_login_at'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
})

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text('key').notNull().unique(), // e.g. "CORE", "UI", "INFRA"
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').notNull().default('Folder'),
  color: text('color').notNull().default('sky'), // 'sky' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple'
  status: text('status').notNull().default('active'), // 'planning' | 'active' | 'paused' | 'completed' | 'canceled'
  health: text('health').notNull().default('on_track'), // 'on_track' | 'at_risk' | 'off_track'
  leadId: text('lead_id').references(() => users.id, { onDelete: 'set null' }),
  leadName: text('lead_name'),
  leadAvatar: text('lead_avatar'),
  startDate: text('start_date'),
  targetDate: text('target_date'),
  budget: integer('budget').notNull().default(0),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
})

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskNumber: integer('task_number').notNull(),
  taskKey: text('task_key').notNull(), // e.g. "CORE-101"
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'), // 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'canceled'
  priority: text('priority').notNull().default('medium'), // 'urgent' | 'high' | 'medium' | 'low' | 'none'
  type: text('type').notNull().default('feature'), // 'feature' | 'bug' | 'task' | 'improvement'
  estimatePoints: integer('estimate_points'), // 1, 2, 3, 5, 8, 13
  assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  assigneeName: text('assignee_name'),
  assigneeAvatar: text('assignee_avatar'),
  dueDate: text('due_date'),
  labels: text('labels').notNull().default('[]'),
  subtasks: text('subtasks').notNull().default('[]'), // JSON array of SubtaskItem
  comments: text('comments').notNull().default('[]'), // JSON array of CommentItem
  attachments: text('attachments').notNull().default('[]'), // JSON array of AttachmentItem
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
})

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('task_assigned'), // 'task_assigned' | 'status_changed' | 'mention' | 'health_alert' | 'system'
  entityType: text('entity_type'), // 'task' | 'project' | 'item'
  entityId: text('entity_id'),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
})

export const activityLogs = sqliteTable('activity_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'),
  userName: text('user_name').notNull(),
  userAvatar: text('user_avatar'),
  action: text('action').notNull(), // 'created' | 'updated_status' | 'commented' | 'assigned' | 'deleted'
  entityType: text('entity_type').notNull(), // 'task' | 'project' | 'user'
  entityId: text('entity_id').notNull(),
  entityTitle: text('entity_title').notNull(),
  details: text('details'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
})

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert

export type ItemStatus = 'backlog' | 'in_progress' | 'in_review' | 'completed' | 'archived'
export type ItemPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ItemCategory = 'engineering' | 'design' | 'marketing' | 'operations' | 'finance'

export type User = typeof users.$inferSelect
export type SafeUser = Omit<User, 'passwordHash'>
export type NewUser = typeof users.$inferInsert
export type UserRole = 'admin' | 'manager' | 'member' | 'guest'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'canceled'
export type ProjectHealth = 'on_track' | 'at_risk' | 'off_track'

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'canceled'
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type TaskType = 'feature' | 'bug' | 'task' | 'improvement'

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type NotificationType = 'task_assigned' | 'status_changed' | 'mention' | 'health_alert' | 'system'

export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert

export interface SubtaskItem {
  id: string
  title: string
  completed: boolean
}

export interface CommentItem {
  id: string
  authorId?: string
  authorName: string
  authorAvatar?: string
  content: string
  createdAt: string
}

export interface AttachmentItem {
  id: string
  name: string
  size: string
  type: string // 'image' | 'document' | 'code' | 'link'
  url: string
  uploadedAt: string
}