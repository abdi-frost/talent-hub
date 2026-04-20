# Talent Hub

https://talent-hub-blue.vercel.app/

## Talent Hub is a fullstack talent management app where:
- **Public users** submit talent profiles and view aggregate stats
- **Admins** securely log in and manage all talent records
- **Super-admins** manage the internal admin team with invite-only onboarding

## Admin Credentials
username: `TalentHubAdmin`
password: `P@ssw0rd`

Built with **Next.js 16 App Router**, **React 19**, **TypeScript**, **Prisma 7 + PostgreSQL**, **Zod 4**, **iron-session**, and **Resend**.

## Screenshots

### Public landing + stats
![Talent Hub landing page](public/screenshots/landing.png)

### Admin records dashboard
![Talent Hub admin records](public/screenshots/records.png)

## Core Features

- Talent submission form with client/server validation
- Public stats API and homepage insights (no PII exposure)
- Admin authentication (session-based)
- Multi-admin support with dedicated team management
- Super-admin authorization for protected admin-management actions
- Invite-by-email onboarding for new admins
- Password reset by secure emailed link
- Responsive admin team UI with mobile cards and desktop table layouts
- Admin dashboard CRUD for talent records
- Skill and primary-skill management from the admin dashboard
- Soft-delete model + audit logging for admin actions
- Typed API response builders and centralized route error handling

## Admin Model

- Multiple admin accounts are supported.
- Only super-admins can access the Team page at `/admin/team`.
- Only super-admins can invite additional admins.
- Super-admin accounts cannot be deleted.
- New admins do not receive a preset password. They receive a secure email link to set their password.
- Existing admins can request password-reset links by email.

## Email Support

- Transactional email delivery is powered by Resend.
- Two email flows are built in: admin invitation and password reset.
- Emails include branded HTML and plain-text versions.
- Reset and invite links use time-limited tokens.
- `APP_BASE_URL` is used to generate absolute links inside emails.

## Architecture (high level)

```text
app/api/* route handlers
  └─ validate input (Zod) + auth checks
     └─ repositories/* (only layer that uses Prisma)
        └─ lib/prisma.ts singleton
           └─ PostgreSQL
```

Auth and access flow:

```text
proxy.ts
  └─ protects /admin routes at the edge/runtime boundary
     └─ lib/auth.ts
        └─ session guards for admin and super-admin access
```

Email flow:

```text
app/api/auth/forgot-password + app/api/admin/admins
  └─ generate raw token for email link
     └─ store hashed token in database
        └─ lib/email.ts sends branded emails through Resend
```

Key structure:
- `app/` — App Router pages + API routes
- `repositories/` — data-access layer (Prisma calls live here)
- `lib/` — auth, email, error handling, response builders, validation schemas
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
- Resend
- bcryptjs 3
- Vitest + React Testing Library
- Playwright

## Local Setup

### 1) Install dependencies
```bash
corepack enable
pnpm install
```

### 2) Configure environment
Create `.env` in the project root:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
SESSION_SECRET=your-32+char-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=P@ssw0rd
APP_BASE_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL="Talent Hub <auth@yourdomain.com>"
RESEND_REPLY_TO=support@yourdomain.com
```

Talent Hub sends admin invites and password-reset emails through Resend. Verify your sending domain in Resend before using a custom `RESEND_FROM_EMAIL` in production.

If you want the seeded primary admin to manage the Team page, make sure that account has `isSuperAdmin = true` in the database.

### 3) Initialize database
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

If your database is remote and migrations were created locally already, you can apply them with:

```bash
pnpm db:migrate:deploy
```

### 4) Run development server
```bash
pnpm dev
```

Open `http://localhost:3000`.

## Useful Scripts

```bash
pnpm dev            # start dev server
pnpm build          # production build
pnpm lint           # lint
pnpm type-check     # TypeScript checks
pnpm test           # unit tests
pnpm test:coverage  # unit tests with coverage
pnpm test:e2e       # Playwright e2e tests
pnpm db:generate    # generate Prisma client
pnpm db:migrate     # create/apply dev migration
pnpm db:migrate:deploy # apply existing migrations
pnpm db:seed        # seed admin and base data
pnpm db:studio      # inspect database in Prisma Studio
```

`pnpm build` runs Prisma client generation automatically before the Next.js production build.

## Design Notes

- Sharp rectangular UI (zero border radius)
- No shadows; borders define structure
- 8px spacing rhythm
- High-contrast palette with vermillion accent

## Admin Team Workflow

1. A super-admin signs in and opens the Team page.
2. They invite a new admin with username and email only.
3. Talent Hub generates a secure token, stores only the hashed version, and emails the raw setup link through Resend.
4. The invited admin sets a password from the emailed link.
5. After activation, that admin can access standard admin surfaces.
6. Only super-admins can continue managing the team.
