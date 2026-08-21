import { createServerFn } from '@tanstack/react-start'
import { eq, and, gt } from 'drizzle-orm'
import { db, ensureTablesExist } from '../db'
import { users, sessions, type UserRole, type UserStatus } from '../db/schema'
import { hashPassword, verifyPassword, generateSessionToken } from './crypto'

// Session duration: 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export const seedAuthAndUsersFn = createServerFn({ method: 'POST' }).handler(async () => {
  await ensureTablesExist()

  const existingUsers = await db.select().from(users)
  if (existingUsers.length > 0) {
    return { success: true, count: existingUsers.length, message: 'Users already seeded' }
  }

  const defaultPasswordHash = await hashPassword('password123')

  const demoUsers: {
    name: string
    email: string
    passwordHash: string
    role: UserRole
    status: UserStatus
    avatar: string
    title: string
    department: string
  }[] = [
    {
      name: 'Elena Rostova',
      email: 'admin@company.com',
      passwordHash: defaultPasswordHash,
      role: 'admin',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      title: 'Head of Product & System Architecture',
      department: 'Engineering',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus@company.com',
      passwordHash: defaultPasswordHash,
      role: 'manager',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Lead Design Systems Architect',
      department: 'Design',
    },
    {
      name: 'Aisha Patel',
      email: 'aisha@company.com',
      passwordHash: defaultPasswordHash,
      role: 'member',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Growth Marketing Director',
      department: 'Marketing',
    },
    {
      name: 'Liam Chen',
      email: 'liam@company.com',
      passwordHash: defaultPasswordHash,
      role: 'member',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Senior Cloud & Edge Operations Lead',
      department: 'Operations',
    },
    {
      name: 'Sophia Zhang',
      email: 'sophia@company.com',
      passwordHash: defaultPasswordHash,
      role: 'manager',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      title: 'VP of Finance & Strategic Planning',
      department: 'Finance',
    },
  ]

  for (const user of demoUsers) {
    await db.insert(users).values(user)
  }

  return { success: true, count: demoUsers.length, message: 'Default demo users seeded successfully' }
})

export const loginFn = createServerFn({ method: 'POST' })
  .validator(
    (data: { email: string; password: string }) => {
      if (!data.email || !data.email.includes('@')) {
        throw new Error('Valid email address is required')
      }
      if (!data.password || data.password.length < 4) {
        throw new Error('Password must be at least 4 characters')
      }
      return data
    },
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()

    // Auto-seed if users table is empty
    const allUsers = await db.select().from(users)
    if (allUsers.length === 0) {
      await seedAuthAndUsersFn()
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase().trim()))

    if (!user) {
      throw new Error('Invalid email or password')
    }

    if (user.status === 'suspended') {
      throw new Error('Account has been suspended. Please contact your workspace administrator.')
    }

    const isMatch = await verifyPassword(data.password, user.passwordHash)
    if (!isMatch) {
      throw new Error('Invalid email or password')
    }

    // Generate session token
    const token = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

    // Create session in DB
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    })

    // Update lastLoginAt
    await db
      .update(users)
      .set({
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id))

    const { passwordHash: _, ...safeUser } = user
    return {
      success: true,
      token,
      user: safeUser,
    }
  })

export const registerFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      name: string
      email: string
      password: string
      role?: UserRole
      department?: string
      title?: string
      avatar?: string
    }) => {
      if (!data.name || data.name.trim().length < 2) {
        throw new Error('Full name is required (min 2 characters)')
      }
      if (!data.email || !data.email.includes('@')) {
        throw new Error('Valid email is required')
      }
      if (!data.password || data.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      return data
    },
  )
  .handler(async ({ data }) => {
    await ensureTablesExist()

    const normalizedEmail = data.email.toLowerCase().trim()
    const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail))
    if (existing) {
      throw new Error('An account with this email address already exists')
    }

    const passwordHash = await hashPassword(data.password)
    const [createdUser] = await db
      .insert(users)
      .values({
        name: data.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: data.role || 'member',
        status: 'active',
        department: data.department?.trim() || 'General',
        title: data.title?.trim() || 'Team Member',
        avatar: data.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        lastLoginAt: new Date().toISOString(),
      })
      .returning()

    const token = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

    await db.insert(sessions).values({
      userId: createdUser.id,
      token,
      expiresAt,
    })

    const { passwordHash: _, ...safeUser } = createdUser
    return {
      success: true,
      token,
      user: safeUser,
    }
  })

export const getCurrentUserFn = createServerFn({ method: 'POST' })
  .validator((data: { token?: string | null }) => data)
  .handler(async ({ data }) => {
    if (!data.token) {
      return { user: null }
    }

    await ensureTablesExist()

    try {
      const now = new Date().toISOString()
      const [session] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.token, data.token), gt(sessions.expiresAt, now)))

      if (!session) {
        return { user: null }
      }

      const [user] = await db.select().from(users).where(eq(users.id, session.userId))
      if (!user || user.status === 'suspended') {
        return { user: null }
      }

      const { passwordHash: _, ...safeUser } = user
      return { user: safeUser }
    } catch (err) {
      console.error('Error fetching current user:', err)
      return { user: null }
    }
  })

export const logoutFn = createServerFn({ method: 'POST' })
  .validator((data: { token?: string | null }) => data)
  .handler(async ({ data }) => {
    if (data.token) {
      try {
        await db.delete(sessions).where(eq(sessions.token, data.token))
      } catch (err) {
        console.error('Error deleting session:', err)
      }
    }
    return { success: true }
  })
