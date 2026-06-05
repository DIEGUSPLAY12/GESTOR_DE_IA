# Implementation Plan: US1 — Gestión de Datos Maestros y Asignaciones

**Parent Plan**: [AI Cost Manager Plan](../plan.md)
**Spec**: [US1 spec.md](./spec.md)
**Priority**: P1 — prerequisite for all other user stories
**Date**: 2026-06-05

---

## Summary

Implementar el CRUD completo de las entidades maestras (Person, Project, AiProvider, PricingPlan, AiAccount) y las tablas de asignación históricas (AccountOwnership, ProjectAssignment), exponiendo endpoints REST y los componentes de frontend correspondientes.

---

## Technical Context

Inherits from [parent plan](../plan.md):

- **Backend**: Node.js + TypeScript + Supabase SDK (`@supabase/supabase-js`), `module: node16`
- **Frontend**: React + Vite + TypeScript + TanStack Query + Tailwind CSS
- **DB**: PostgreSQL via Supabase — migrations in `apps/backend/supabase/migrations/`
- **Monetary precision**: `DECIMAL(19,4)` for `unit_price`, `monthly_budget`, `percentage`
- **Testing**: Vitest (unit), Playwright (E2E), 80% coverage minimum

---

## Architecture

### Backend layer (`apps/backend/src/modules/master-data/`)

```
master-data/
├── people_projects.ts    ← CRUD services + REST handlers for Person & Project
├── accounts.ts           ← CRUD services + REST handlers for AiProvider, PricingPlan, AiAccount
├── assignments.ts        ← Business logic for AccountOwnership & ProjectAssignment
└── validators.ts         ← Percentage sum invariant checks (shared)
```

**Design decisions**:
- Each module exports: `router` (Express/Hono router) and service functions (testable without HTTP).
- The percentage-sum validation (`validateOwnershipSum`, `validateAssignmentSum`) lives in `validators.ts` and is called at the service layer — not just at the HTTP layer — to guarantee the invariant even for internal calls.
- Soft deletes: all tables have a `deleted_at TIMESTAMPTZ` column; queries always filter `WHERE deleted_at IS NULL`.

### Frontend layer (`apps/frontend/src/features/master-data/`)

```
master-data/
├── api/
│   └── hooks.ts          ← TanStack Query hooks (usePersons, useProjects, useAccounts…)
├── components/
│   ├── ProjectsTable.tsx  ← Accessible data table with column sort & status filter
│   └── AssignmentForm.tsx ← Controlled form with % validation (max 100% check on submit)
└── types.ts              ← Shared TS types mirroring API contracts
```

---

## Database Migrations (Phase 2)

Migrations are written in SQL and executed via Supabase CLI, following the order:

1. `0001_master_schema.sql` — Person, Project, AiProvider, PricingPlan tables
2. `0002_assignment_schema.sql` — AiAccount, AccountOwnership, ProjectAssignment tables

Refer to [data-model.md](../data-model.md) for full column definitions.

---

## API Contracts (summary)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/people` | List all active persons |
| POST | `/api/v1/people` | Create person |
| PATCH | `/api/v1/people/:id` | Update person |
| DELETE | `/api/v1/people/:id` | Soft-delete person |
| GET | `/api/v1/projects` | List active projects |
| POST | `/api/v1/projects` | Create project |
| PATCH | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Soft-delete project |
| GET | `/api/v1/providers` | List AI providers |
| POST | `/api/v1/providers` | Create provider |
| GET | `/api/v1/accounts` | List AI accounts |
| POST | `/api/v1/accounts` | Create AI account |
| POST | `/api/v1/accounts/:id/owners` | Add/update owner (validates sum ≤ 100%) |
| POST | `/api/v1/people/:id/assignments` | Assign person to project (validates sum ≤ 100%) |

All responses follow `{ data, error }` envelope. Validation errors return `HTTP 422` with field-level messages.

---

## Constitution Check (US1)

- [x] **Code Quality**: ESLint + Prettier enforced; no inline secrets.
- [x] **Testing**: All service functions unit-tested; acceptance scenarios covered in Playwright E2E.
- [x] **Architecture**: Master data is a standalone module with no dependency on imputation-engine.
- [x] **UX/Accessibility**: Tables and forms meet WCAG 2.1 AA (accessible labels, keyboard navigation).
- [x] **Performance**: List endpoints paginated; frontend uses TanStack Query with stale-while-revalidate.

---

## Dependency Map

```
US1 (Master Data)  ──────►  US2 (Imputation Engine)  ──────►  US3 (Budgets)
                                                               US4 (Consultants)
```

US1 must be complete before imputation calculations can be run in US2.
