# Tasks: US3 — Control de Presupuestos y Desviaciones

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Parent tasks**: [../../tasks.md](../../tasks.md) — T027–T029
**Prerequisite**: US2 imputations must exist (ImputationResult rows) before budget queries return real data.

---

## Phase A: Backend — Budget API

- [X] A001 [US3] Crear `apps/backend/src/modules/budgets/api.ts`
  - `GET /api/v1/budgets?period_month=YYYY-MM` — filtra por `project_manager_id` del JWT
  - Returns `BudgetSummary[]`: `{ project_id, project_name, monthly_budget, actual_cost, percentage_used, status }`
  - `status` = `'OK' | 'WARNING' | 'DANGER'` (thresholds: <70%, 70–89%, ≥90%)
  - Index hint: query uses `(project_id, period_month)` index from migration 0003

---

## Phase B: Frontend — Dashboard Components

- [X] B001 [P] [US3] Implementar hook `useBudgets(periodMonth)` en `apps/frontend/src/features/budgets/api/hooks.ts`
  - TanStack Query: `queryKey: ['budgets', periodMonth]`
  - Invalidated when imputation calculation completes (via mutation side-effect)

- [X] B002 [US3] Crear `apps/frontend/src/features/budgets/components/BudgetDashboard.tsx`
  - Recharts `BarChart`: presupuesto vs coste real por proyecto
  - Eje X: nombre de proyecto; Eje Y: importe en EUR
  - Tooltip con porcentaje consumido
  - WCAG 2.1 AA: `aria-label` en el chart, alternativa en tabla accesible

- [X] B003 [P] [US3] Crear `apps/frontend/src/features/budgets/components/DeviationsAlert.tsx`
  - Tarjeta por proyecto con indicador de estado (verde/amarillo/rojo)
  - El estado se transmite por color Y por texto (`aria-live` para actualizaciones dinámicas)
  - Props: `summary: BudgetSummary`

---

## Acceptance Criteria Cross-Check

| Scenario | Tasks covering it |
|----------|--------------------|
| SC-US3-01: Alerta visual desviación | A001, B002, B003 |
| SC-US3-02: Visibilidad sólo proyectos propios | A001 (filtro JWT) |
| SC-004: Registro visible al superar umbral 80% | A001, B003 |
