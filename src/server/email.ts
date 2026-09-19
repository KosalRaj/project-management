import { createServerFn } from '@tanstack/react-start'
import crypto from 'crypto'
import { eq, desc } from 'drizzle-orm'
import { db, ensureTablesExist } from '../db'
import {
  users,
  emailLogs,
  type EmailLog,
  type NotificationPreferences,
} from '../db/schema'
import { requireAuthUser } from './auth-helpers'
import {
  getAppBaseUrl,
  isSmtpConfigured,
  getTransporter,
  sendEmail,
  renderVerificationEmail,
  renderTestEmail,
} from './email-service'

// 1. Send / Resend Email Verification
export const sendEmailVerificationFn = createServerFn({ method: 'POST' })
  .validator((data: { email: string; token?: string }) => {
    if (!data.email) throw new Error('Email is required')
    return data
  })
  .handler(async ({ data }) => {
    await ensureTablesExist()

    const normalizedEmail = data.email.toLowerCase().trim()
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail))
    if (!user) {
      throw new Error('User not found')
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email is already verified' }
    }

    // Generate secure token and 6-digit OTP
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    // Store token on user (format: token:otp)
    const storedTokenValue = `${verificationToken}:${otpCode}`
    await db
      .update(users)
      .set({
        emailVerificationToken: storedTokenValue,
        emailVerificationExpiresAt: expiresAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id))

    const appUrl = getAppBaseUrl()
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`
    const { html, text } = renderVerificationEmail(user.name, verificationUrl, otpCode)

    const sendResult = await sendEmail({
      to: user.email,
      toName: user.name,
      subject: `[Action Required] Verify your Project Pulse account`,
      templateType: 'verification',
      html,
      text,
      metadata: { userId: user.id, verificationUrl },
    })

    return {
      success: true,
      status: sendResult.status,
      verificationUrl, // included for dev convenience
      otpCode,
    }
  })

// 2. Verify Email Token or 6-digit OTP Code
export const verifyEmailTokenFn = createServerFn({ method: 'POST' })
  .validator((data: { token?: string; code?: string; email?: string }) => {
    if (!data.token && (!data.code || !data.email)) {
      throw new Error('Either a verification token or email + 6-digit code is required')
    }
    return data
  })
  .handler(async ({ data }) => {
    await ensureTablesExist()

    const now = new Date().toISOString()
    let matchedUser: typeof users.$inferSelect | undefined

    if (data.token) {
      // Find user with matching token prefix
      const allUsers = await db.select().from(users)
      matchedUser = allUsers.find(
        (u) =>
          u.emailVerificationToken &&
          u.emailVerificationToken.split(':')[0] === data.token &&
          u.emailVerificationExpiresAt &&
          u.emailVerificationExpiresAt > now,
      )
    } else if (data.email && data.code) {
      const normalizedEmail = data.email.toLowerCase().trim()
      const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail))
      if (
        user &&
        user.emailVerificationToken &&
        user.emailVerificationToken.split(':')[1] === data.code.trim() &&
        user.emailVerificationExpiresAt &&
        user.emailVerificationExpiresAt > now
      ) {
        matchedUser = user
      }
    }

    if (!matchedUser) {
      throw new Error('Invalid or expired email verification link/code. Please request a new one.')
    }

    // Mark as verified
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, matchedUser.id))

    const { passwordHash: _, ...safeUser } = matchedUser
    return {
      success: true,
      user: { ...safeUser, emailVerified: true },
      message: 'Email address successfully verified!',
    }
  })

// 3. SMTP & Email Diagnostic Status Check
export const verifySmtpConfigFn = createServerFn({ method: 'GET' }).handler(async () => {
  const configured = isSmtpConfigured()
  const provider = process.env.EMAIL_PROVIDER || (configured ? 'smtp' : 'simulated')
  const host = process.env.SMTP_HOST || 'None (Simulated Mailbox)'
  const port = process.env.SMTP_PORT || '587'
  const user = process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***` : 'None'
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'notifications@example.com'

  let connectionStatus: 'connected' | 'simulated' | 'failed' = configured ? 'connected' : 'simulated'
  let connectionMessage = configured
    ? `Ready for production relay via ${host}:${port}`
    : 'Running in Local Simulated Mode. Emails are captured to database logs & console.'

  if (configured) {
    try {
      const transporter = getTransporter()
      if (transporter) {
        await transporter.verify()
        connectionStatus = 'connected'
        connectionMessage = `Successfully authenticated with ${host}:${port}`
      }
    } catch (err: any) {
      connectionStatus = 'failed'
      connectionMessage = `SMTP Handshake Failed: ${err?.message || 'Check credentials'}`
    }
  }

  return {
    provider,
    configured,
    host,
    port,
    user,
    fromEmail,
    connectionStatus,
    connectionMessage,
  }
})

// 4. Send Test Diagnostic Email (Admin only)
export const sendTestEmailFn = createServerFn({ method: 'POST' })
  .validator((data: { token?: string; targetEmail: string }) => {
    if (!data.targetEmail || !data.targetEmail.includes('@')) {
      throw new Error('Valid recipient email is required')
    }
    return data
  })
  .handler(async ({ data }) => {
    await ensureTablesExist()
    await requireAuthUser(data.token, ['admin'])

    const host = process.env.SMTP_HOST || 'Simulated Engine'
    const { html, text } = renderTestEmail(data.targetEmail, `Relay: ${host}`)

    const result = await sendEmail({
      to: data.targetEmail,
      subject: `[Test] Project Pulse SMTP Diagnostic Check`,
      templateType: 'test',
      html,
      text,
      metadata: { triggeredByAdmin: true },
    })

    return result
  })

// 5. Get Email Logs / Outbox (Admin only)
export const getEmailLogsFn = createServerFn({ method: 'POST' })
  .validator((data?: { token?: string }) => data)
  .handler(async ({ data }): Promise<EmailLog[]> => {
    await ensureTablesExist()
    await requireAuthUser(data?.token, ['admin'])

    try {
      const logs = await db.select().from(emailLogs).orderBy(desc(emailLogs.sentAt)).limit(50)
      return logs
    } catch (err) {
      console.error('Error fetching email logs:', err)
      return []
    }
  })

// 6. Update User Notification Preferences
export const updateNotificationPreferencesFn = createServerFn({ method: 'POST' })
  .validator((data: { token?: string; preferences: NotificationPreferences }) => data)
  .handler(async ({ data }) => {
    await ensureTablesExist()
    const caller = await requireAuthUser(data.token)

    await db
      .update(users)
      .set({
        notificationPreferences: JSON.stringify(data.preferences),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, caller.id))

    return { success: true }
  })
