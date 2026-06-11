# Tasks: US4 — Consulta Individual de Consumo

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Parent tasks**: [../../tasks.md](../../tasks.md) — T030–T031
**Prerequisite**: US1 (master data), US2 (imputations) must be complete.

---

## Phase A: Backend — Consultant API

- [X] A001 [US4] Crear `apps/backend/src/modules/consultants/api.ts`
  - `GET /api/v1/consultants/me/costs?period_month=YYYY-MM`
  - Auth: any authenticated user (Consultant, PM, Admin)
  - `current_person_id` resolved from JWT middleware — never from query param
  - Returns `ConsultantCostView[]`: `{ account_name, provider_name, period_month, allocated_cost, currency, ownership_pct, calculation_trace }`
  - If JWT sub maps to no `Person`, returns `HTTP 403 Forbidden`

---

## Phase B: Frontend — Consultant Dashboard

- [X] B001 [P] [US4] Implementar hook `useMyConsultantCosts(periodMonth)` en `apps/frontend/src/features/consultants/api/hooks.ts`
  - TanStack Query: `queryKey: ['consultant-costs', periodMonth]`

- [X] B002 [US4] Crear `apps/frontend/src/features/consultants/components/ConsultantDashboard.tsx`
  - Tabla de sólo lectura: columnas Account, Provider, Period, Cost (EUR), Ownership %
  - Estado vacío con mensaje informativo si no hay cuentas asignadas
  - Sin botones de edición ni acción (rol Consultor = read-only)
  - WCAG 2.1 AA: `role="table"`, encabezados con scope

---

## Acceptance Criteria Cross-Check

| Scenario | Tasks covering it |
|----------|--------------------|
| SC-US4-01: Vista de consumo personal | A001, B001, B002 |
| FR-021: Sólo lectura para Consultor | B002 (no mutation controls) |
| FR-022: Identidad resuelta de JWT | A001 (middleware) |
