# Tasks: US1 — Gestión de Datos Maestros y Asignaciones

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Parent tasks**: [../../tasks.md](../../tasks.md) — T008, T009, T022, T023, T024, T025, T026
**Strategy**: API-first (backend service + endpoint → frontend hook → frontend component). Percentage-sum invariant validated at service layer.

---

## Phase A: Database Migrations

- [X] A001 [US1] Escribir migración `0001_master_schema.sql` para Person, Project, AiProvider, PricingPlan con índices y RLS básico en `apps/backend/supabase/migrations/0001_master_schema.sql`
  - Tables: `person`, `project`, `ai_provider`, `pricing_plan`
  - All tables include `deleted_at TIMESTAMPTZ` for soft delete
  - All monetary columns: `DECIMAL(19,4)`

- [X] A002 [US1] Escribir migración `0002_assignment_schema.sql` para AiAccount, AccountOwnership, ProjectAssignment en `apps/backend/supabase/migrations/0002_assignment_schema.sql`
  - Tables: `ai_account`, `account_ownership`, `project_assignment`
  - `percentage` columns: `DECIMAL(5,2)`, CHECK `0 < percentage <= 100`
  - Foreign key constraints with appropriate `ON DELETE RESTRICT`

---

## Phase B: Backend — Validators & Shared Logic

- [X] B001 [US1] Implementar `validateOwnershipSum()` y `validateAssignmentSum()` en `apps/backend/src/modules/master-data/validators.ts`
  - Query active records (non-deleted, overlapping date range)
  - Return `{ valid: boolean; currentTotal: number; message?: string }`

---

## Phase C: Backend — CRUD Services & Endpoints

- [X] C001 [US1] Crear servicios CRUD y endpoints REST para Person y Project en `apps/backend/src/modules/master-data/people_projects.ts`
  - `GET /api/v1/people`, `POST`, `PATCH /:id`, `DELETE /:id` (soft)
  - `GET /api/v1/projects`, `POST`, `PATCH /:id`, `DELETE /:id` (soft)

- [X] C002 [P] [US1] Crear servicios CRUD y endpoints REST para AiProvider, PricingPlan y AiAccount en `apps/backend/src/modules/master-data/accounts.ts`
  - `GET /api/v1/providers`, `POST /api/v1/providers`
  - `GET /api/v1/accounts`, `POST /api/v1/accounts`
  - `POST /api/v1/accounts/:id/owners` — uses `validateOwnershipSum()`

- [ ] C003 [P] [US1] Crear endpoints de asignación persona-proyecto en `apps/backend/src/modules/master-data/assignments.ts`
  - `POST /api/v1/people/:id/assignments` — uses `validateAssignmentSum()`
  - `GET /api/v1/people/:id/assignments`
  - `DELETE /api/v1/assignments/:id` (soft close by setting `valid_to = today`)

---

## Phase D: Frontend — API Hooks

- [ ] D001 [P] [US1] Implementar TanStack Query hooks para todas las entidades maestras en `apps/frontend/src/features/master-data/api/hooks.ts`
  - `usePersons()`, `useCreatePerson()`, `useUpdatePerson()`, `useDeletePerson()`
  - `useProjects()`, `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()`
  - `useProviders()`, `useAccounts()`, `useCreateAccount()`
  - `useAssignOwner()`, `useAssignProject()`
  - Cache invalidation on mutations

---

## Phase E: Frontend — UI Components

- [ ] E001 [US1] Crear componente `ProjectsTable` accesible en `apps/frontend/src/features/master-data/components/ProjectsTable.tsx`
  - Columns: code, name, client, PM, budget, status (active/inactive)
  - Column sort, filter by status (active/inactive)
  - WCAG 2.1 AA: `role="table"`, `aria-sort`, keyboard navigation
  - Action buttons: Edit, Soft-delete

- [ ] E002 [P] [US1] Crear formulario `AssignmentForm` en `apps/frontend/src/features/master-data/components/AssignmentForm.tsx`
  - Fields: person, project, percentage, valid_from, valid_to (optional)
  - Client-side guard: warn if new % would exceed 100% (based on cached current total)
  - Server error from `422` surfaced inline below the percentage field

---

## Acceptance Criteria Cross-Check

| Scenario | Tasks covering it |
|----------|--------------------|
| SC-US1-01: Añadir titular sin superar 100% | B001, C002, D001 |
| SC-US1-02: Asignar consultor ≤ 100% | B001, C003, E002 |
| SC-US1-03: Borrado lógico | A001, A002, C001, C002, C003 |
| FR-011: Filtros en listados | E001 |
