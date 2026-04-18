<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (16.x) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Talent Hub — Agent Context

## Tech Stack
- **Next.js 16** (App Router, Turbopack dev)
- **React 19** + TypeScript 5 (strict)
- **Tailwind CSS v4** (no config file — configured via `@theme` in `globals.css`)
- **Prisma 7** + PostgreSQL
- **Zod 4** (validation)
- **iron-session 8** (session auth)
- **bcryptjs 3** (password hashing)
- **Vitest 2** + React Testing Library (unit tests)
- **Playwright** (E2E tests)

---

## Project Structure

```
app/
  layout.tsx          Root layout — wraps with ErrorOverlayProvider
  page.tsx            Public homepage with stats
  error.tsx           Segment-level error boundary
  global-error.tsx    Root-level error boundary
  submit/             Public talent submission page
  admin/
    layout.tsx        Passthrough only (no nav — avoids nav on login page)
    page.tsx          Redirects → /admin/dashboard
    login/            Login page (no nav)
    (dashboard)/      Route group — adds dashboard nav layout
      layout.tsx      Nav bar (requireAdmin inside pages, not here)
      dashboard/      Main admin CRUD page
  api/
    talents/
      route.ts        GET (stats) + POST (submit)
      [id]/route.ts   PUT + DELETE (admin only, with audit log)
    admin/
      talents/route.ts  GET paginated list of all talents (admin only)
    auth/
      login/route.ts  POST — sets iron-session + writes audit log
      logout/route.ts POST — destroys session + redirects

lib/
  errors.ts           AppError class with static factories
  response.ts         4 response type builders (single/paginated/success/failure)
  handle-route.ts     withErrorHandling() HOF for all route handlers
  validations.ts      Zod schemas (talentSubmissionSchema, adminLoginSchema, talentListQuerySchema, etc.)
  prisma.ts           Singleton PrismaClient
  auth.ts             getSession / requireAdmin / getAuthenticatedAdminOrThrow
  constants.ts        PREDEFINED_SKILLS, APP_NAME, etc.
  api-client.ts       Typed fetch wrapper (client-side), throws ApiClientError

repositories/         ← THE ONLY PLACE where Prisma is called
  talent.repository.ts   CRUD + soft-delete + paginated list for Talent
  admin.repository.ts    findByUsername, findById, updateLastLogin for Admin
  stats.repository.ts    Public aggregated stats — no PII returned
  audit.repository.ts    Write-only audit trail (fire-and-forget)
  index.ts               Barrel export — import from "@/repositories"

hooks/
  use-api-call.ts     React hook — wraps async calls, auto-pipes to error overlay

components/
  providers/
    error-overlay-provider.tsx  Global API error overlay context + UI

prisma/
  schema.prisma       Talent + Admin + AuditLog models
  seed.ts             Seeds default admin account
```

---

## Core Patterns — ALWAYS follow these

### 0. Repository layer is the ONLY Prisma access point
```ts
// ✅ Correct — import from repositories
import { talentRepository, auditRepository } from "@/repositories";
const talent = await talentRepository.findById(id);

// ❌ Wrong — never use prisma directly in a route handler
import { prisma } from "@/lib/prisma";
const talent = await prisma.talent.findUnique(...);
```

### 1. Throwing errors (server-side)
```ts
throw AppError.notFound("Talent");
throw AppError.conflict("Email already registered");
throw AppError.validationError(parsed.error.flatten());
throw AppError.unauthorized();
```

### 2. Route handler structure
```ts
export const GET = withErrorHandling(async (req: NextRequest) => {
  // business logic — throw AppError if needed
  return single(data);          // or paginated / success / failure
});
```
Never use bare `try/catch` inside route handlers — `withErrorHandling` does it.

### 3. API response shapes (4 canonical forms)
```ts
// Single entity
return single(entity, 201);
// { data: T }

// Paginated list
return paginated(items, { page, pageSize, total });
// { data: T[], pagination: { page, pageSize, total, totalPages, hasNext, hasPrev } }

// Action confirmed
return success("Deleted successfully");
// { success: true, message?: string }

// Error (auto-handled by withErrorHandling)
return failure(AppError.notFound("Talent"));
// { success: false, error: { code, message, details? } }
```

### 4. Client-side API calls
```ts
// In components, always use useApiCall — it auto-shows the error overlay on failure
const { execute, loading } = useApiCall();
const result = await execute(() => apiClient.post<SingleResponse<Talent>>("/api/talents", payload));
```

### 5. Auth in API routes vs pages
- **API route handlers** → `await getAuthenticatedAdminOrThrow()` (throws 401 AppError)
- **Server components / pages** → `await requireAdmin()` (redirects to /admin/login)

### 6. Params in route handlers (Next.js 15+/16)
```ts
// params is always a Promise in App Router
async function handler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

---

## Design System

See `app/globals.css` for full token definitions. Key rules:
- **Zero border-radius** — `border-radius: 0 !important` enforced globally
- **No shadows** — use borders for structure
- **Colors**: background `#fafaf8`, foreground `#0a0a0a`, accent `#e63000` (vermillion)
- **Fonts**: `font-display` = Bebas Neue, `font-sans` = DM Sans, `font-mono` = DM Mono
- **8px spacing grid** — use multiples of 8 for all spacing
- **Border tokens**: `border-[var(--color-border)]` (dark), `border-[var(--color-border-light)]` (subtle)

### 6. Audit logging for all admin mutations
```ts
// Fire-and-forget — NEVER await, never let audit failure break the operation
auditRepository
  .log({ adminId: session.adminId!, action: AdminAction.TALENT_UPDATED, entityType: "talent", entityId: id })
  .catch(console.error);
```

### 7. Soft delete contract
- `talentRepository.softDelete(id)` sets `deletedAt = now()` — record is NOT removed
- All repository reads filter `where: { deletedAt: null }` — deleted records are invisible
- Never call `prisma.talent.delete()` — use `softDelete()` instead

### 8. Status lifecycle
```
PENDING → APPROVED  (admin approves)
PENDING → REJECTED  (admin rejects)
```
Update via `talentRepository.update(id, { status: "APPROVED" })` or the dedicated
`updateStatus(id, status)` method.

---

## Database Schema

### Models
| Model | Key fields | Notes |
|---|---|---|
| `Talent` | id, email (unique), primarySkill, skills[], status, deletedAt | Soft-deleted via deletedAt |
| `Admin` | id, username (unique), password (bcrypt), lastLoginAt | |
| `AuditLog` | adminId (FK→Admin), action (enum), entityType, entityId, metadata (JSON) | entityType/entityId are strings, not FK — logs survive deleted entities |

### Enums
- `TalentStatus`: `PENDING` | `APPROVED` | `REJECTED`
- `AdminAction`: `TALENT_CREATED` | `TALENT_UPDATED` | `TALENT_DELETED` | `TALENT_APPROVED` | `TALENT_REJECTED` | `ADMIN_LOGIN` | `ADMIN_LOGOUT`

### Key Indexes
- GIN index on `Talent.skills[]` for array-contains queries
- Index on `status`, `primarySkill`, `yearsOfExperience`, `deletedAt`
- Compound index on `AuditLog(entityType, entityId)`

---

## Database Commands
```bash
pnpm db:generate    # generate Prisma client after schema changes
pnpm db:push        # push schema to DB (dev, no migration file)
pnpm db:migrate     # create + apply migration file
pnpm db:seed        # seed default admin (admin / P@ssw0rd)
pnpm db:studio      # open Prisma Studio
```

## Test Commands
```bash
pnpm test           # run all unit tests
pnpm test:watch     # vitest watch mode
pnpm test:coverage  # coverage report
pnpm test:e2e       # playwright e2e tests
```

---

## Environment Variables
```
DATABASE_URL          PostgreSQL connection string (required)
SESSION_SECRET        ≥32-char random string for iron-session (required)
ADMIN_USERNAME        Seed admin username (optional, default: admin)
ADMIN_PASSWORD        Seed admin password (optional, default: P@ssw0rd)
```

---

## Validation (Zod v4)
- Use `z.email()` not `z.string().email()` for standalone email fields
- `z.enum(PREDEFINED_SKILLS)` — no second-arg message (use `.min()/.max()` chains)
- Update schemas via `talentUpdateSchema = talentSubmissionSchema.omit({ email: true }).partial()`

