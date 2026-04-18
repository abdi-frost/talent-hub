# Talent Management System — Final Requirements

## 📌 Overview

A fullstack Talent Management System built with Next.js that allows users to submit their profiles and enables admins to manage talent records. The public interface focuses on submission and aggregated insights (stats), while all sensitive data remains restricted to the admin panel.

---

## 👥 User Roles

### Public User

* Submit talent profile
* View aggregated statistics (no access to individual records)

### Admin

* Secure login
* View all talent records
* Update talent data
* Delete talent records

---

## 🧩 Core Features

### 1. Talent Submission

Users can submit the following:

* Full Name (required)
* Email (required, unique)
* Primary Skill (required)
* Skills (multi-select from predefined list)
* Years of Experience (number ≥ 0)
* Description (required)

#### Behavior

* Client-side + server-side validation
* Disabled submit during processing
* Clear error messages
* Success feedback on submission

---

### 2. Public Stats Dashboard

Displayed on the homepage:

* Total number of talents
* Total unique skills
* Average years of experience
* Most common skill

#### Notes

* No exposure of personal data
* Must handle empty states gracefully
* Should update dynamically from database

---

### 3. Admin Dashboard

#### Features

* Table-based layout
* List all talents with:

  * Name
  * Email
  * Primary Skill
  * Experience
* Actions:

  * Edit
  * Delete

---

### 4. Authentication

* Admin login only (no signup)
* Protected routes under `/admin`
* Session-based authentication

---


## 🎨 UI / Design System

### Principles

* Zero border radius (sharp edges only)
* High contrast (black / white / other main color palette (NOT PURPLE OR BLUE))
* No shadows — use borders instead
* Grid-based layout system

### Components

* Rectangular buttons and inputs
* Thin borders for structure
* Consistent spacing (8px scale)

---

## ⚙️ Tech Stack

* Next.js (App Router)
* Tailwind CSS
* Prisma ORM
* PostgreSQL
* Zod (validation)

---

## 🧠 Validation Rules

* Email must be valid and unique
* Required fields must not be empty
* Years of experience ≥ 0
* Skills must come from predefined list

---

## 🧪 Testing Requirements

### Unit Testing

* Test validation schemas
* Test API handlers (success + failure cases)
* Test utility functions

Recommended tools:

* React Testing Library (for components)

---

### End-to-End (E2E) Testing

* Submit talent flow
* Admin login flow
* Admin CRUD operations
* Stats rendering

Recommended tool:

* Playwright

---

## 🔁 CI/CD (GitHub Actions)

### Workflow Requirements

Create `.github/workflows/ci.yml`:

#### Pipeline should:

* Install dependencies
* Run linting
* Run unit tests
* Run E2E tests
* Build project

## 🔐 Security

* Protect admin routes via middleware/proxy
* Validate all inputs server-side
* Do not expose sensitive data publicly

---

## ✨ UX Requirements

* Loading states for all async actions
* Clear success/error feedback
* Empty states for no data
* Disabled buttons during processing

---

## 📦 Deliverables

* Complete GitHub repository
* Clean project structure
* README with:

  * Setup instructions
  * Tech stack
  * Design decisions

---

## 🚫 Out of Scope

* File uploads
* Payments
* Multi-user roles
* Real-time updates

---

## �️ Technical Architecture & Established Patterns

This section documents the architectural decisions made during implementation.
All agents and contributors **must** follow these patterns consistently.

---

### Layered Architecture

```
Route Handler (app/api/**/route.ts)
    │  validates input (Zod)
    │  calls repository methods
    │  returns typed response builders
    ▼
Repository Layer (repositories/*.repository.ts)
    │  all Prisma operations live here — NO direct prisma calls in route handlers
    │  throws AppError for domain-level failures (notFound, conflict, etc.)
    ▼
Prisma Client (lib/prisma.ts)
    │  singleton, shared across the process
    ▼
PostgreSQL
```

---

### Repository Pattern

Every Prisma model has a dedicated repository file in `repositories/`.
All repositories are exported from `repositories/index.ts`.

**Rules:**
- Route handlers import from `@/repositories` only — never from `@/lib/prisma` directly
- Repositories throw `AppError` (not Prisma errors) when a domain constraint fails
- Repositories do **not** know about HTTP, sessions, or audit logging
- `withErrorHandling` in `lib/handle-route.ts` catches and maps remaining Prisma errors

**Repositories:**
| File | Model | Responsibility |
|---|---|---|
| `talent.repository.ts` | `Talent` | CRUD + soft-delete + paginated list |
| `admin.repository.ts` | `Admin` | findByUsername, findById, updateLastLogin |
| `stats.repository.ts` | _(Talent aggregate)_ | Public stats — no PII returned |
| `audit.repository.ts` | `AuditLog` | Write-only audit trail |

---

### Error Handling

**Server-side:** use `AppError` static factories — never throw plain `Error` in business code.

```ts
throw AppError.notFound("Talent");
throw AppError.conflict("Email already registered");
throw AppError.validationError(parsed.error.flatten());
throw AppError.unauthorized();
```

**Route handler:** always wrap with `withErrorHandling()` — handles AppError, Prisma errors,
ZodError, and Next.js redirect/not-found signals automatically.

```ts
export const GET = withErrorHandling(async (req) => { ... });
```

**Client-side:** use `useApiCall()` hook — pipes `ApiClientError` to the global error overlay automatically.

```ts
const { execute, loading } = useApiCall();
const result = await execute(() => apiClient.post("/api/talents", payload));
```

---

### API Response Structure

Every route handler returns **exactly one** of these four shapes:

| Builder | Shape | When to use |
|---|---|---|
| `single(data, status?)` | `{ data: T }` | Single entity returned (GET one, POST create) |
| `paginated(data, meta)` | `{ data: T[], pagination: {...} }` | Lists with page/pageSize/total |
| `success(message?)` | `{ success: true, message? }` | Action confirmed, no entity returned |
| `failure(AppError)` | `{ success: false, error: { code, message, details? } }` | Explicit error (also auto-used by withErrorHandling) |

---

### Audit Logging

All admin mutations write a row to `AuditLog` via `auditRepository.log(...)`.
Audit calls are **fire-and-forget** — they must never block or fail the primary operation:

```ts
auditRepository.log({ adminId, action, entityType, entityId, metadata })
  .catch(console.error); // never awaited
```

---

### Database Schema Design Decisions

**Soft Delete:** `Talent.deletedAt` — records are never hard-deleted by admin actions.
All repository reads filter `deletedAt: null`. Deleted records are retained for the audit trail.

**Talent Status Lifecycle:**
```
PENDING → APPROVED   (admin approves a submission)
PENDING → REJECTED   (admin rejects a submission)
```
Public stats (`GET /api/talents`) count **APPROVED only**.
Admin dashboard shows all non-deleted records regardless of status.

**AuditLog design:** `entityType` + `entityId` are plain strings (not FK) so log rows
survive soft-deleted or future hard-deleted entities.

**GIN index** on `Talent.skills[]` enables efficient PostgreSQL array-contains queries.

---

### Auth Separation

| Context | Helper | Behaviour on failure |
|---|---|---|
| Server Component / Page | `requireAdmin()` | Redirects to `/admin/login` |
| API Route Handler | `getAuthenticatedAdminOrThrow()` | Throws `AppError.unauthorized()` → 401 JSON |

---

### Tech Stack Versions

| Package | Version | Notes |
|---|---|---|
| Next.js | 16.x | App Router, `params` is always a `Promise` |
| React | 19.x | |
| Zod | 4.x | Use `z.email()`, `z.url()` — not `z.string().email()` |
| Prisma | 7.x | Run `pnpm db:generate` after every schema change |
| iron-session | 8.x | |
| Tailwind CSS | 4.x | Config via `@theme` in `globals.css` — no `tailwind.config.js` |
| Vitest | 2.x | Unit tests in `tests/unit/` |
| Playwright | latest | E2E tests in `tests/e2e/` |

---

## 🎯 Goal

Deliver a clean, well-structured, and fully functional fullstack application that demonstrates:

* Solid architectural decisions
* Clear separation of concerns
* Reliable validation and error handling
* Professional UI consistency

