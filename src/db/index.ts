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

export const client = createClient({
  url: config.url,
  authToken: config.authToken,
})

export const db = drizzle(client, { schema })

let initPromise: Promise<void> | null = null

export async function ensureTablesExist() {
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
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT,
          updated_at TEXT
        );
      `)
    } catch (err) {
      console.error('Error ensuring database tables exist:', err)
    }
  })()

  return initPromise
}