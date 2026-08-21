# Turso + TanStack Start Fullstack Integration Guide

This guide walks you through setting up, developing, and deploying a **TanStack Start** fullstack application powered by **Turso (LibSQL)** and **Drizzle ORM**, with deployment target on **Cloudflare Workers**.

---

## 🏗️ Architecture Overview

```
[Local Development]                                  [Production Deployment]
pnpm dev                                             pnpm deploy (wrangler deploy)
  │                                                    │
  ▼                                                    ▼
TanStack Start (Vite Dev Server)                     Cloudflare Workers (Edge Runtime)
  │ (.env)                                             │ (Cloudflare Secrets)
  ▼                                                    ▼
Drizzle ORM ───────────────────────────────────► Remote Turso Database
                                                 (libsql://your-db.turso.io)
```

By connecting both your local development environment and production deployment directly to your Turso database in the cloud:
- ✅ **Cross-Device Synchronization**: Database state remains identical when switching between your laptop, desktop, or workspace.
- ✅ **Zero Native Binaries at the Edge**: Uses `@libsql/client/web` with pure fetch/HTTP protocols, perfectly compatible with Cloudflare Workers.
- ✅ **Type Safety**: End-to-end TypeScript types inferred from your Drizzle schema all the way to UI components.

---

## 1. Quick Start with Turso CLI

### Step 1.1: Install Turso CLI

- **Windows (PowerShell / WinGet)**:
  ```powershell
  winget install Turso.turso
  ```
- **macOS / Linux**:
  ```bash
  curl -sSfL https://get.tur.so/install.sh | bash
  ```

### Step 1.2: Authenticate with Turso

```bash
turso auth signup
# Or if you already have an account:
turso auth login
```

### Step 1.3: Create Your Database

```bash
turso db create my-tanstack-app
```

### Step 1.4: Retrieve Database URL & Auth Token

1. Get the database URL:
   ```bash
   turso db show my-tanstack-app --url
   # Output example: libsql://my-tanstack-app-username.turso.io
   ```

2. Generate an authorization token:
   ```bash
   turso db tokens create my-tanstack-app
   # Output example: eyJhbGciOiJFZERTQ...
   ```

---

## 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your Turso credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
TURSO_DATABASE_URL="libsql://my-tanstack-app-username.turso.io"
TURSO_AUTH_TOKEN="your_turso_auth_token_here"
```

*(Note: If `TURSO_DATABASE_URL` is omitted, the app will gracefully fall back to local `file:local.db` for offline testing).*

---

## 3. Database Schema & Drizzle Commands

The database schema is defined in [`src/db/schema.ts`](../src/db/schema.ts).

### Push Schema to Turso

Apply schema definitions directly to your Turso database:

```bash
pnpm db:push
```

### Open Visual Database Studio

Explore and edit records directly in your browser:

```bash
pnpm db:studio
```

### Generate Migration Files (Optional)

If your workflow requires version-controlled SQL migration scripts:

```bash
pnpm db:generate
```

---

## 4. Running the Fullstack Application

Start the development server with live reload and SSR:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Server-Side Rendering (SSR)**: The page preloads initial items from Turso via TanStack Start route `loader`.
- **Server Functions (`createServerFn`)**: Creating, toggling, or deleting items calls type-safe server functions that execute Drizzle queries directly against Turso.
- **Client Cache Invalidation**: The router invalidates and refreshes the data without full page reloads.

---

## 5. Deploying to Cloudflare Workers

The project is pre-configured with `wrangler.jsonc` and the Nitro Cloudflare compatibility flags (`nodejs_compat`).

### Step 5.1: Authenticate Wrangler with Cloudflare

```bash
npx wrangler login
```

### Step 5.2: Set Secrets on Cloudflare

Set your Turso database URL and token securely in Cloudflare:

```bash
npx wrangler secret put TURSO_DATABASE_URL
# Enter your Turso database URL when prompted

npx wrangler secret put TURSO_AUTH_TOKEN
# Enter your Turso auth token when prompted
```

### Step 5.3: Build & Deploy

Deploy your fullstack app to Cloudflare Workers:

```bash
pnpm build
pnpm deploy
```

---

## 6. Project Structure

```
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (button, card, input, badge, checkbox)
│   │   ├── Header.tsx        # Navigation header
│   │   └── Footer.tsx        # Footer
│   ├── db/
│   │   ├── schema.ts         # Drizzle SQLite schema definitions
│   │   └── index.ts          # Turso LibSQL client singleton
│   ├── lib/
│   │   └── utils.ts          # Utility functions (cn class combiner)
│   ├── routes/
│   │   ├── __root.tsx        # Root layout, HTML shell, and Devtools
│   │   ├── index.tsx         # Fullstack dashboard with SSR loader and CRUD UI
│   │   └── about.tsx         # About route
│   ├── server/
│   │   └── items.ts          # Type-safe TanStack Start server functions (CRUD)
│   ├── router.tsx            # TanStack Router instance
│   └── styles.css            # Tailwind CSS v4 design tokens and styles
├── docs/
│   └── TURSO_GUIDE.md        # This integration guide
├── drizzle.config.ts         # Drizzle Kit CLI configuration
├── wrangler.jsonc            # Cloudflare Workers deployment configuration
└── vite.config.ts            # Vite 8 + TanStack Start configuration
```

---

## 7. Useful Reference Links

- [Turso Documentation](https://docs.turso.tech)
- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [Drizzle ORM - Turso / LibSQL Guide](https://orm.drizzle.team/docs/get-started/turso-new)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
