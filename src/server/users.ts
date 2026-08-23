import { createServerFn } from '@tanstack/react-start'
import { eq, desc } from 'drizzle-orm'
import { db, ensureTablesExist } from '../db'
import { users, sessions, type User, type UserRole, type UserStatus } from '../db/schema'
import { hashPassword } from './crypto'
import { requireAuthUser } from './auth-helpers'

// 1. Get all users
export const getUsersFn = createServerFn({ method: 'GET' }).handler(async () => {
  await ensureTablesExist()
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt))
    return allUsers.map(({ passwordHash: _, ...safeUser }) => safeUser)
  } catch (err) {
    console.error('Error fetching users:', err)
    return []
  }
})

// 2. Create user (Admin only)
export const createUserFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      token?: string
      name: string
      email: string
      password?: string
      role?: UserRole
      status?: UserStatus
      department?: string
      title?: string
      avatar?: string
    }) => {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Name is required')
      }
      if (!data.email || !data.email.includes('@')) {
        throw new Error('Valid email is required')
      }
      return data
    },
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()

    // Enforce Admin role
    await requireAuthUser(data.token, ['admin'])

    const normalizedEmail = data.email.toLowerCase().trim()
    const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail))
    if (existing) {
      throw new Error('User with this email already exists')
    }

    const defaultPassword = data.password || 'password123'
    const passwordHash = await hashPassword(defaultPassword)

    const [created] = await db
      .insert(users)
      .values({
        name: data.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: data.role || 'member',
        status: data.status || 'active',
        department: data.department?.trim() || 'General',
        title: data.title?.trim() || 'Team Member',
        avatar:
          data.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning()

    const { passwordHash: _, ...safeUser } = created
    return safeUser
  })

// 3. Update user (Role/Status changes restricted to Admin only)
export const updateUserFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      token?: string
      id: string
      name?: string
      email?: string
      role?: UserRole
      status?: UserStatus
      department?: string
      title?: string
      avatar?: string
    }) => {
      if (!data.id) {
        throw new Error('User ID is required')
      }
      return data
    },
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()

    // Validate authenticated caller
    const caller = await requireAuthUser(data.token, ['admin', 'manager', 'member'])

    // Role Escalation Defense: Only admins can alter roles
    if (data.role !== undefined && caller.role !== 'admin') {
      throw new Error('Forbidden: Only workspace Administrators can modify user roles.')
    }

    // Status Alteration Defense: Only admins can alter account status
    if (data.status !== undefined && caller.role !== 'admin') {
      throw new Error('Forbidden: Only workspace Administrators can modify account status.')
    }

    // Identity Defense: Non-admins can only modify their own profile details
    if (caller.role !== 'admin' && caller.id !== data.id) {
      throw new Error('Forbidden: You can only edit your own user profile.')
    }

    const updatePayload: Partial<User> = {
      updatedAt: new Date().toISOString(),
    }

    if (data.name !== undefined) updatePayload.name = data.name.trim()
    if (data.email !== undefined) updatePayload.email = data.email.toLowerCase().trim()
    if (data.role !== undefined && caller.role === 'admin') updatePayload.role = data.role
    if (data.status !== undefined && caller.role === 'admin') updatePayload.status = data.status
    if (data.department !== undefined) updatePayload.department = data.department.trim()
    if (data.title !== undefined) updatePayload.title = data.title.trim()
    if (data.avatar !== undefined) updatePayload.avatar = data.avatar

    const [updated] = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, data.id))
      .returning()

    if (!updated) {
      throw new Error('User not found')
    }

    const { passwordHash: _, ...safeUser } = updated
    return safeUser
  })

// 4. Delete user (Admin only)
export const deleteUserFn = createServerFn({ method: 'POST' })
  .validator((data: { token?: string; id: string }) => {
    if (!data.id) throw new Error('User ID is required')
    return data
  })
  .handler(async ({ data }) => {
    await ensureTablesExist()

    const caller = await requireAuthUser(data.token, ['admin'])

    if (caller.id === data.id) {
      throw new Error('Cannot delete your own active administrator account.')
    }

    // Delete associated sessions
    await db.delete(sessions).where(eq(sessions.userId, data.id))
    // Delete user
    await db.delete(users).where(eq(users.id, data.id))
    return { success: true, id: data.id }
  })

// 5. Toggle user status (Admin only)
export const toggleUserStatusFn = createServerFn({ method: 'POST' })
  .validator((data: { token?: string; id: string; status: UserStatus }) => data)
  .handler(async ({ data }) => {
    await ensureTablesExist()

    const caller = await requireAuthUser(data.token, ['admin'])

    if (caller.id === data.id && data.status !== 'active') {
      throw new Error('Cannot deactivate your own active administrator account.')
    }

    const [updated] = await db
      .update(users)
      .set({
        status: data.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, data.id))
      .returning()

    const { passwordHash: _, ...safeUser } = updated
    return safeUser
  })

// 6. Reset user password (Admin only)
export const resetUserPasswordFn = createServerFn({ method: 'POST' })
  .validator((data: { token?: string; id: string; newPassword: string }) => {
    if (!data.id) throw new Error('User ID is required')
    if (!data.newPassword || data.newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }
    return data
  })
  .handler(async ({ data }) => {
    await ensureTablesExist()

    await requireAuthUser(data.token, ['admin'])

    const passwordHash = await hashPassword(data.newPassword)
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, data.id))

    // Revoke previous sessions
    await db.delete(sessions).where(eq(sessions.userId, data.id))

    return { success: true }
  })
