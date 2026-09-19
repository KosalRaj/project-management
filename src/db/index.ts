import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

function getDatabaseConfig() {
  const url = process.env.TURSO_DATABASE_URL || 'file:local.db'
  const authToken = process.env.TURSO_AUTH_TOKEN

  return {
    url,
    authToken,
  }
}

const config = getDatabaseConfig()

export const client: ReturnType<typeof createClient> =
  typeof window === 'undefined'
    ? createClient({
        url: config.url,
        authToken: config.authToken,
      })
    : (null as unknown as ReturnType<typeof createClient>)

export const db: ReturnType<typeof drizzle<typeof schema>> =
  typeof window === 'undefined'
    ? drizzle(client, { schema })
    : (null as unknown as ReturnType<typeof drizzle<typeof schema>>)

let initPromise: Promise<void> | null = null

export async function ensureTablesExist() {
  if (typeof window !== 'undefined') return
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'member',
          status TEXT NOT NULL DEFAULT 'active',
          avatar TEXT,
          title TEXT,
          department TEXT,
          last_login_at TEXT,
          created_at TEXT,
          updated_at TEXT
        );
      `)

      await client.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          created_at TEXT
        );
      `)

      await client.execute(`
        CREATE TABLE IF NOT EXISTS items (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'backlog',
          priority TEXT NOT NULL DEFAULT 'medium',
          category TEXT NOT NULL DEFAULT 'engineering',
          assignee_name TEXT,
          assignee_avatar TEXT,
          due_date TEXT,
          progress INTEGER NOT NULL DEFAULT 0,
          budget INTEGER NOT NULL DEFAULT 0,
          completed INTEGER NOT NULL DEFAULT 0,
          tags TEXT NOT NULL DEFAULT '[]',
          created_at TEXT,
          updated_at TEXT
        );
      `)

      await client.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT NOT NULL DEFAULT 'Folder',
          color TEXT NOT NULL DEFAULT 'sky',
          status TEXT NOT NULL DEFAULT 'active',
          health TEXT NOT NULL DEFAULT 'on_track',
          lead_id TEXT,
          lead_name TEXT,
          lead_avatar TEXT,
          start_date TEXT,
          target_date TEXT,
          budget INTEGER NOT NULL DEFAULT 0,
          created_at TEXT,
          updated_at TEXT
        );
      `)

      await client.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          task_number INTEGER NOT NULL,
          task_key TEXT NOT NULL,
          project_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'todo',
          priority TEXT NOT NULL DEFAULT 'medium',
          type TEXT NOT NULL DEFAULT 'feature',
          estimate_points INTEGER,
          assignee_id TEXT,
          assignee_name TEXT,
          assignee_avatar TEXT,
          due_date TEXT,
          labels TEXT NOT NULL DEFAULT '[]',
          subtasks TEXT NOT NULL DEFAULT '[]',
          comments TEXT NOT NULL DEFAULT '[]',
          attachments TEXT NOT NULL DEFAULT '[]',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT,
          updated_at TEXT
        );
      `)

      // Gracefully ensure attachments column exists if table was already created
      try {
        await client.execute(`ALTER TABLE tasks ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]';`)
      } catch (_) {}

      // Gracefully ensure email verification and notification preference columns exist on users
      try {
        await client.execute(`ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1;`)
      } catch (_) {}
      try {
        await client.execute(`ALTER TABLE users ADD COLUMN email_verification_token TEXT;`)
      } catch (_) {}
      try {
        await client.execute(`ALTER TABLE users ADD COLUMN email_verification_expires_at TEXT;`)
      } catch (_) {}
      try {
        await client.execute(`ALTER TABLE users ADD COLUMN notification_preferences TEXT NOT NULL DEFAULT '{"notifyOnTaskAssigned":true,"notifyOnStatusChange":true,"notifyOnHealthAlert":true,"notifyOnMention":true}';`)
      } catch (_) {}

      await client.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'task_assigned',
          entity_type TEXT,
          entity_id TEXT,
          read INTEGER NOT NULL DEFAULT 0,
          created_at TEXT
        );
      `)

      await client.execute(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          user_name TEXT NOT NULL,
          user_avatar TEXT,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          entity_title TEXT NOT NULL,
          details TEXT,
          created_at TEXT
        );
      `)

      await client.execute(`
        CREATE TABLE IF NOT EXISTS email_logs (
          id TEXT PRIMARY KEY,
          recipient_email TEXT NOT NULL,
          recipient_name TEXT,
          subject TEXT NOT NULL,
          template_type TEXT NOT NULL,
          html_body TEXT NOT NULL,
          text_body TEXT,
          status TEXT NOT NULL DEFAULT 'delivered',
          error_message TEXT,
          metadata TEXT,
          sent_at TEXT
        );
      `)
    } catch (err) {
      console.error('Error ensuring database tables exist:', err)
    }
  })()

  return initPromise
}