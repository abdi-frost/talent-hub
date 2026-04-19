# Talent Hub

Talent Hub is a fullstack talent management app where:
- **Public users** submit talent profiles and view aggregate stats
- **Admins** securely log in and manage all talent records

Built with **Next.js 16 App Router**, **React 19**, **TypeScript**, **Prisma 7 + PostgreSQL**, **Zod 4**, and **iron-session**.

## Screenshots

### Public landing + stats
![Talent Hub landing page](public/screenshots/landing.png)

### Admin records dashboard
![Talent Hub admin records](public/screenshots/records.png)

## Core Features

- Talent submission form with client/server validation
- Public stats API and homepage insights (no PII exposure)
- Admin authentication (session-based)
- Admin dashboard CRUD for talent records
- Soft-delete model + audit logging for admin actions
- Typed API response builders and centralized route error handling

## Architecture (high level)

```text
app/api/* route handlers
  └─ validate input (Zod) + auth checks
     └─ repositories/* (only layer that uses Prisma)
        └─ lib/prisma.ts singleton
           └─ PostgreSQL
```

Key structure:
- `app/` — App Router pages + API routes
- `repositories/` — data-access layer (Prisma calls live here)
- `lib/` — auth, error handling, response builders, validation schemas
- `components/` + `hooks/` — UI and client logic
- `prisma/` — schema + seed scripts
- `tests/` — unit + E2E tests

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript 5 (strict)
- Tailwind CSS v4
- Prisma 7 + PostgreSQL (`pg`)
- Zod 4
- iron-session 8
- bcryptjs 3
- Vitest + React Testing Library
- Playwright

## Local Setup

### 1) Install dependencies
```bash
corepack enable
corepack pnpm install
```

### 2) Configure environment
Create `.env` in the project root:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
SESSION_SECRET=your-32+char-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=P@ssw0rd
```

### 3) Initialize database
```bash
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
```

### 4) Run development server
```bash
corepack pnpm dev
```

Open `http://localhost:3000`.

## Useful Scripts

```bash
corepack pnpm dev            # start dev server
corepack pnpm build          # production build
corepack pnpm lint           # lint
corepack pnpm type-check     # TypeScript checks
corepack pnpm test           # unit tests
corepack pnpm test:coverage  # unit tests with coverage
corepack pnpm test:e2e       # Playwright e2e tests
```

## Design Notes

- Sharp rectangular UI (zero border radius)
- No shadows; borders define structure
- 8px spacing rhythm
- High-contrast palette with vermillion accent
