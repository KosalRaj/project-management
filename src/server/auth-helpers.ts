import { db, ensureTablesExist } from '../db'
import { users, sessions, type SafeUser, type UserRole } from '../db/schema'
import { eq, and, gt } from 'drizzle-orm'

/**
 * Validates a session token and returns the authenticated user, or null if invalid/expired.
 */
export async function getSessionUser(token?: string | null): Promise<SafeUser | null> {
  if (!token) return null
  await ensureTablesExist()

  try {
    const now = new Date().toISOString()
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))

    if (!session) return null

    const [user] = await db.select().from(users).where(eq(users.id, session.userId))
    if (!user || user.status === 'suspended') return null

    const { passwordHash: _, ...safeUser } = user
    return safeUser
  } catch (err) {
    console.error('Error validating session user:', err)
    return null
  }
}

/**
 * Enforces authentication and optional role-based access control.
 * Throws an Error if unauthorized or insufficient privileges.
 */
export async function requireAuthUser(
  token?: string | null,
  allowedRoles?: UserRole[],
): Promise<SafeUser> {
  const caller = await getSessionUser(token)
  if (!caller) {
    throw new Error('Unauthorized: A valid active session is required to perform this action.')
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(caller.role as UserRole)) {
    throw new Error(
      `Forbidden: Access denied. Required role: ${allowedRoles.join(' or ')}. Your current role is: ${caller.role}.`,
    )
  }

  return caller
}
