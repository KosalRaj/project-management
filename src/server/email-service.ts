import nodemailer from 'nodemailer'
import { db, ensureTablesExist } from '../db'
import {
  emailLogs,
  type EmailTemplateType,
} from '../db/schema'

// Configuration constants
export function getAppBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '')
  }
  return 'http://localhost:3000'
}

export function getFromEmailConfig() {
  const fromName = process.env.SMTP_FROM_NAME || 'Project Pulse'
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'notifications@example.com'
  return {
    fromName,
    fromEmail,
    formatted: `"${fromName}" <${fromEmail}>`,
  }
}

export function isSmtpConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}

// Nodemailer transporter singleton
let cachedTransporter: nodemailer.Transporter | null = null

export function getTransporter(): nodemailer.Transporter | null {
  if (!isSmtpConfigured()) return null
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST!
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const secure = process.env.SMTP_SECURE === 'true' || port === 465

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })

  return cachedTransporter
}

// Core Email Sending Engine
export interface SendEmailOptions {
  to: string
  toName?: string
  subject: string
  templateType: EmailTemplateType
  html: string
  text?: string
  metadata?: Record<string, any>
}

export async function sendEmail(options: SendEmailOptions): Promise<{
  success: boolean
  status: 'delivered' | 'simulated' | 'failed'
  messageId?: string
  error?: string
}> {
  await ensureTablesExist()

  const { to, toName, subject, templateType, html, text, metadata } = options
  const { formatted, fromEmail, fromName } = getFromEmailConfig()
  const plainText = text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  const provider = process.env.EMAIL_PROVIDER || (isSmtpConfigured() ? 'smtp' : 'simulated')

  // 1. MailChannels Provider (for Cloudflare Workers runtime)
  if (provider === 'mailchannels') {
    try {
      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to, name: toName || to }] }],
          from: { email: fromEmail, name: fromName },
          subject,
          content: [
            { type: 'text/plain', value: plainText },
            { type: 'text/html', value: html },
          ],
        }),
      })

      if (response.ok) {
        await logEmailRecord({
          recipientEmail: to,
          recipientName: toName,
          subject,
          templateType,
          htmlBody: html,
          textBody: plainText,
          status: 'delivered',
          metadata: metadata ? JSON.stringify(metadata) : null,
        })
        return { success: true, status: 'delivered' }
      } else {
        const errorText = await response.text()
        console.error('MailChannels dispatch failed:', response.status, errorText)
        await logEmailRecord({
          recipientEmail: to,
          recipientName: toName,
          subject,
          templateType,
          htmlBody: html,
          textBody: plainText,
          status: 'failed',
          errorMessage: `HTTP ${response.status}: ${errorText}`,
          metadata: metadata ? JSON.stringify(metadata) : null,
        })
        return { success: false, status: 'failed', error: errorText }
      }
    } catch (err: any) {
      console.error('MailChannels request error:', err)
      await logEmailRecord({
        recipientEmail: to,
        recipientName: toName,
        subject,
        templateType,
        htmlBody: html,
        textBody: plainText,
        status: 'failed',
        errorMessage: err?.message || 'MailChannels error',
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      return { success: false, status: 'failed', error: err?.message }
    }
  }

  // 2. Standard SMTP Provider
  const transporter = getTransporter()
  if (transporter && provider === 'smtp') {
    try {
      const info = await transporter.sendMail({
        from: formatted,
        to: toName ? `"${toName}" <${to}>` : to,
        subject,
        html,
        text: plainText,
      })

      await logEmailRecord({
        recipientEmail: to,
        recipientName: toName,
        subject,
        templateType,
        htmlBody: html,
        textBody: plainText,
        status: 'delivered',
        metadata: JSON.stringify({ messageId: info.messageId, ...(metadata || {}) }),
      })

      return { success: true, status: 'delivered', messageId: info.messageId }
    } catch (err: any) {
      console.error('SMTP email dispatch error:', err)
      await logEmailRecord({
        recipientEmail: to,
        recipientName: toName,
        subject,
        templateType,
        htmlBody: html,
        textBody: plainText,
        status: 'failed',
        errorMessage: err?.message || 'SMTP delivery failed',
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      return { success: false, status: 'failed', error: err?.message }
    }
  }

  // 3. Zero-Config Local Simulated Outbox (Development mode)
  console.log('\n' + '='.repeat(70))
  console.log(`📨 [SIMULATED EMAIL OUTBOX] To: ${to} (${toName || 'User'})`)
  console.log(`📌 Subject: ${subject}`)
  console.log(`🏷️  Template: ${templateType}`)
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`)
  console.log('-'.repeat(70))
  console.log(plainText)
  console.log('='.repeat(70) + '\n')

  await logEmailRecord({
    recipientEmail: to,
    recipientName: toName,
    subject,
    templateType,
    htmlBody: html,
    textBody: plainText,
    status: 'simulated',
    metadata: metadata ? JSON.stringify(metadata) : null,
  })

  return { success: true, status: 'simulated' }
}

async function logEmailRecord(record: {
  recipientEmail: string
  recipientName?: string | null
  subject: string
  templateType: EmailTemplateType
  htmlBody: string
  textBody?: string | null
  status: 'delivered' | 'simulated' | 'failed'
  errorMessage?: string | null
  metadata?: string | null
}) {
  try {
    await db.insert(emailLogs).values({
      recipientEmail: record.recipientEmail,
      recipientName: record.recipientName || null,
      subject: record.subject,
      templateType: record.templateType,
      htmlBody: record.htmlBody,
      textBody: record.textBody || null,
      status: record.status,
      errorMessage: record.errorMessage || null,
      metadata: record.metadata || null,
      sentAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Error recording email log:', err)
  }
}

// ----------------------------------------------------------------------
// Responsive HTML Email Templates
// ----------------------------------------------------------------------

const EMAIL_BASE_STYLES = `
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; }
  .email-container { max-width: 580px; margin: 30px auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
  .email-header { background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding: 28px 32px; border-bottom: 1px solid #1f2937; text-align: center; }
  .brand-logo { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; text-decoration: none; }
  .brand-pill { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); margin-top: 8px; }
  .email-body { padding: 32px; color: #cbd5e1; font-size: 14px; line-height: 1.6; }
  .btn-cta { display: inline-block; padding: 12px 28px; background: #4f46e5; color: #ffffff !important; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; margin: 20px 0; text-align: center; }
  .otp-box { font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #38bdf8; background: #0f172a; border: 1px solid #334155; padding: 14px 20px; border-radius: 10px; text-align: center; margin: 18px 0; font-family: monospace; }
  .meta-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin: 16px 0; }
  .meta-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #1e293b; }
  .meta-row:last-child { border-bottom: none; }
  .meta-label { color: #64748b; font-weight: 600; }
  .meta-value { color: #f1f5f9; font-weight: 600; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .tag-urgent { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
  .tag-high { background: rgba(249, 115, 22, 0.2); color: #fb923c; }
  .tag-medium { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
  .tag-low { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; }
  .email-footer { padding: 24px 32px; background: #0b0f17; border-top: 1px solid #1f2937; text-align: center; font-size: 11px; color: #64748b; }
`

export function renderVerificationEmail(name: string, verificationUrl: string, otpCode: string): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/><style>${EMAIL_BASE_STYLES}</style></head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="brand-logo">🚀 Project Pulse</div>
          <div class="brand-pill">Email Confirmation Required</div>
        </div>
        <div class="email-body">
          <h2 style="color:#ffffff; margin-top:0; font-size:18px;">Welcome, ${name}!</h2>
          <p>Thank you for registering on Project Pulse. Please confirm your email address to activate all workspace features, task assignment notifications, and password recovery.</p>
          
          <p style="margin-bottom:6px; font-weight:600; color:#f1f5f9;">Your 6-Digit Verification Code:</p>
          <div class="otp-box">${otpCode}</div>

          <div style="text-align:center;">
            <a href="${verificationUrl}" class="btn-cta">Verify Email Address &rarr;</a>
          </div>

          <p style="font-size:12px; color:#94a3b8; margin-top:20px;">
            Or copy and paste this link in your browser:<br/>
            <a href="${verificationUrl}" style="color:#818cf8; word-break:break-all;">${verificationUrl}</a>
          </p>
          <p style="font-size:11px; color:#64748b;">This verification link and code will expire in 24 hours. If you did not create this account, please ignore this email.</p>
        </div>
        <div class="email-footer">
          &copy; ${new Date().getFullYear()} Project Pulse Workspace &bull; Enterprise Task & Roadmap Management
        </div>
      </div>
    </body>
    </html>
  `
  const text = `Welcome to Project Pulse, ${name}!\n\nPlease verify your email address.\nYour 6-digit confirmation code: ${otpCode}\n\nClick the link below to confirm:\n${verificationUrl}\n\n(Expires in 24 hours).`
  return { html, text }
}

export function renderTaskAssignedEmail(
  assigneeName: string,
  task: { taskKey: string; title: string; priority: string; dueDate?: string | null; description?: string | null },
  project: { name: string; key: string },
  assignerName: string,
  taskUrl: string,
): { html: string; text: string } {
  const priorityClass = `tag-${task.priority.toLowerCase()}`
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/><style>${EMAIL_BASE_STYLES}</style></head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="brand-logo">🚀 Project Pulse</div>
          <div class="brand-pill">Task Assignment</div>
        </div>
        <div class="email-body">
          <h2 style="color:#ffffff; margin-top:0; font-size:18px;">Hello, ${assigneeName}</h2>
          <p><strong>${assignerName}</strong> has assigned you to a new task in <strong>${project.name}</strong> (${project.key}).</p>

          <div class="meta-card">
            <div style="font-size:15px; font-weight:700; color:#38bdf8; margin-bottom:8px;">
              [${task.taskKey}] ${task.title}
            </div>
            <div style="font-size:12px; color:#cbd5e1; margin-bottom:12px;">
              ${task.description || 'No description provided.'}
            </div>
            <table style="width:100%; font-size:12px; border-collapse:collapse;">
              <tr>
                <td style="color:#64748b; padding:4px 0;">Project:</td>
                <td style="color:#f1f5f9; font-weight:600; text-align:right;">${project.name} (${project.key})</td>
              </tr>
              <tr>
                <td style="color:#64748b; padding:4px 0;">Priority:</td>
                <td style="text-align:right;"><span class="tag ${priorityClass}">${task.priority}</span></td>
              </tr>
              <tr>
                <td style="color:#64748b; padding:4px 0;">Due Date:</td>
                <td style="color:#f1f5f9; font-weight:600; text-align:right;">${task.dueDate || 'No due date'}</td>
              </tr>
            </table>
          </div>

          <div style="text-align:center;">
            <a href="${taskUrl}" class="btn-cta">Open Task in Board &rarr;</a>
          </div>
        </div>
        <div class="email-footer">
          You received this email because you are assigned to this task in Project Pulse.
        </div>
      </div>
    </body>
    </html>
  `
  const text = `Hello ${assigneeName},\n\n${assignerName} assigned you to [${task.taskKey}] ${task.title} in ${project.name}.\nPriority: ${task.priority}\nDue Date: ${task.dueDate || 'None'}\n\nView Task: ${taskUrl}`
  return { html, text }
}

export function renderStatusChangeEmail(
  recipientName: string,
  task: { taskKey: string; title: string },
  oldStatus: string,
  newStatus: string,
  updaterName: string,
  taskUrl: string,
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/><style>${EMAIL_BASE_STYLES}</style></head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="brand-logo">🚀 Project Pulse</div>
          <div class="brand-pill">Task Status Update</div>
        </div>
        <div class="email-body">
          <h2 style="color:#ffffff; margin-top:0; font-size:18px;">Hello, ${recipientName}</h2>
          <p><strong>${updaterName}</strong> updated the status for <strong>[${task.taskKey}] ${task.title}</strong>.</p>

          <div class="meta-card" style="text-align:center; padding:20px;">
            <span style="font-size:12px; font-weight:700; text-transform:uppercase; color:#94a3b8;">${oldStatus.replace('_', ' ')}</span>
            <span style="font-size:16px; margin: 0 12px; color:#818cf8;">&rarr;</span>
            <span style="font-size:14px; font-weight:800; text-transform:uppercase; color:#38bdf8; background:rgba(56,189,248,0.15); padding:4px 12px; border-radius:6px;">${newStatus.replace('_', ' ')}</span>
          </div>

          <div style="text-align:center;">
            <a href="${taskUrl}" class="btn-cta">View Updated Task &rarr;</a>
          </div>
        </div>
        <div class="email-footer">
          &copy; ${new Date().getFullYear()} Project Pulse Workspace
        </div>
      </div>
    </body>
    </html>
  `
  const text = `Hello ${recipientName},\n\n${updaterName} updated status for [${task.taskKey}] ${task.title} from ${oldStatus} to ${newStatus}.\n\nView Task: ${taskUrl}`
  return { html, text }
}

export function renderHealthAlertEmail(
  recipientName: string,
  project: { name: string; key: string },
  oldHealth: string,
  newHealth: string,
  projectUrl: string,
): { html: string; text: string } {
  const isOffTrack = newHealth === 'off_track'
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/><style>${EMAIL_BASE_STYLES}</style></head>
    <body>
      <div class="email-container">
        <div class="email-header" style="${isOffTrack ? 'background: linear-gradient(135deg, #4c0519 0%, #1e1b4b 100%);' : ''}">
          <div class="brand-logo">⚠️ Project Health Alert</div>
          <div class="brand-pill" style="${isOffTrack ? 'color:#fb7185; background:rgba(244,63,94,0.2); border-color:rgba(244,63,94,0.4);' : ''}">Action Required</div>
        </div>
        <div class="email-body">
          <h2 style="color:#ffffff; margin-top:0; font-size:18px;">Project Escalation: ${project.name}</h2>
          <p>Hello <strong>${recipientName}</strong>,</p>
          <p>The health status for project <strong>${project.name} (${project.key})</strong> has changed from <strong>${oldHealth}</strong> to <strong style="color:#fb7185;">${newHealth.toUpperCase()}</strong>.</p>

          <p>Please review active blockers, sprint velocity, and open high-priority tasks to restore healthy delivery.</p>

          <div style="text-align:center;">
            <a href="${projectUrl}" class="btn-cta" style="background:#e11d48;">Inspect Project Roadmap &rarr;</a>
          </div>
        </div>
        <div class="email-footer">
          You received this alert because you are the designated lead or manager for ${project.key}.
        </div>
      </div>
    </body>
    </html>
  `
  const text = `Project Escalation: ${project.name} (${project.key})\n\nHealth changed from ${oldHealth} to ${newHealth.toUpperCase()}.\n\nInspect: ${projectUrl}`
  return { html, text }
}

export function renderTestEmail(toEmail: string, serverInfo: string): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/><style>${EMAIL_BASE_STYLES}</style></head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="brand-logo">🚀 Project Pulse</div>
          <div class="brand-pill">SMTP Handshake Test</div>
        </div>
        <div class="email-body">
          <h2 style="color:#ffffff; margin-top:0; font-size:18px;">SMTP Connection Successful!</h2>
          <p>This is a diagnostic test email sent from your Project Pulse instance to confirm that outbound email delivery is working smoothly.</p>

          <div class="meta-card">
            <div style="font-size:12px; color:#cbd5e1;">
              <strong>Recipient:</strong> ${toEmail}<br/>
              <strong>Server Timestamp:</strong> ${new Date().toISOString()}<br/>
              <strong>Relay Status:</strong> ${serverInfo}
            </div>
          </div>

          <p style="font-size:12px; color:#94a3b8;">You are all set to deliver task assignments, status alerts, and email verifications.</p>
        </div>
        <div class="email-footer">
          &copy; ${new Date().getFullYear()} Project Pulse Workspace
        </div>
      </div>
    </body>
    </html>
  `
  const text = `Project Pulse SMTP Test\n\nOutbound delivery is operational for ${toEmail}.\nTimestamp: ${new Date().toISOString()}\nStatus: ${serverInfo}`
  return { html, text }
}
