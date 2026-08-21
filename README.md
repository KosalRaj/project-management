# Fullstack TanStack Start + Turso + Drizzle + Cloudflare

A modern, high-performance, fullstack web application built with **TanStack Start**, **Turso (LibSQL)**, **Drizzle ORM**, **Tailwind CSS v4**, and **shadcn/ui** components. Configured for unified cloud database synchronization in both local development and edge production on **Cloudflare Workers**.

---

## ⚡ Features

- **TanStack Start & Router**: Full-document SSR, streaming, and full type-safe routing.
- **Turso LibSQL Database**: Edge-native database with SQLite syntax and fast multi-region replication.
- **Drizzle ORM**: End-to-end type safety from schema definition to server functions and UI components.
- **Server Functions (`createServerFn`)**: Server-side RPC actions directly invoked from client UI.
- **shadcn/ui & Tailwind v4**: Accessible, customizable components styled with utility classes.
- **Cloudflare Workers Edge Ready**: Pre-configured with `wrangler.jsonc` for instant edge deployments.
- **Device Synchronization**: Unified Turso cloud database across all development devices and production.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and set your Turso database credentials:

```bash
cp .env.example .env
```

```env
TURSO_DATABASE_URL="libsql://your-db-org.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"
```

> 📖 **Need help creating a Turso database?** Check out the complete [Turso Integration Guide](docs/TURSO_GUIDE.md).

### 3. Push Schema to Turso

```bash
pnpm db:push
```

### 4. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Starts the Vite dev server with SSR and hot reloading on port 3000 |
| `pnpm build` | Builds the client and server bundle for production |
| `pnpm preview` | Previews the production build locally |
| `pnpm typecheck` | Typechecks TypeScript across the entire project |
| `pnpm db:push` | Pushes the Drizzle schema directly to Turso |
| `pnpm db:studio` | Launches Drizzle Studio visual database GUI in browser |
| `pnpm db:generate` | Generates SQL migration files |
| `pnpm deploy` | Deploys the application to Cloudflare Workers using Wrangler |

---

## 📚 Documentation

For complete step-by-step instructions on Turso provisioning, CLI usage, secret management, and Cloudflare deployment, please refer to:

👉 **[docs/TURSO_GUIDE.md](docs/TURSO_GUIDE.md)**
