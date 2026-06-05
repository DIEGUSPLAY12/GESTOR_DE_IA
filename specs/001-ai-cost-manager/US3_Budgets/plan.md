# Implementation Plan: US3 — Control de Presupuestos y Desviaciones

**Parent Plan**: [AI Cost Manager Plan](../plan.md)
**Spec**: [US3 spec.md](./spec.md)
**Priority**: P3
**Date**: 2026-06-05

---

## Summary

Exponer un endpoint de consulta de presupuesto por proyecto y construir el dashboard de presupuestos con indicadores visuales de desviación. Los datos se agregan desde `ImputationResult` en tiempo de consulta — no se persiste ninguna entidad adicional.

---

## Technical Context

- **Backend**: endpoint `GET /api/v1/budgets` — agrega `ImputationResult` por proyecto/periodo, devuelve `BudgetSummary[]`
- **Frontend**: `BudgetDashboard.tsx` + `DeviationsAlert.tsx` usando TanStack Query + Recharts
- **Auth**: el filtro `project_manager_id` se extrae del JWT; el backend nunca devuelve proyectos ajenos al usuario logueado

---

## Architecture

### Backend (`apps/backend/src/modules/budgets/`)

```
budgets/
└── api.ts   ← GET /api/v1/budgets?period_month=YYYY-MM
              ← GET /api/v1/budgets/:project_id?period_month=YYYY-MM
```

Query logic:
```sql
SELECT
  p.id            AS project_id,
  p.monthly_budget,
  SUM(ir.allocated_cost) AS actual_cost,
  ROUND(SUM(ir.allocated_cost) / p.monthly_budget * 100, 2) AS percentage_used
FROM project p
LEFT JOIN imputation_result ir ON ir.project_id = p.id AND ir.period_month = :period
WHERE p.project_manager_id = :current_user_id
  AND p.deleted_at IS NULL
GROUP BY p.id, p.monthly_budget
```

`status` enum computed in application layer: `'OK' | 'WARNING' | 'DANGER'` based on `percentage_used`.

### Frontend (`apps/frontend/src/features/budgets/`)

```
budgets/
├── components/
│   ├── BudgetDashboard.tsx    ← Bar chart (Recharts): budget vs actual per project
│   └── DeviationsAlert.tsx    ← Status card per project with colour-coded indicator
└── api/
    └── hooks.ts               ← useBudgets(periodMonth), useBudgetByProject(id, month)
```

---

## Status Thresholds

| Range | Label | Colour |
|-------|-------|--------|
| < 70% | OK | Green |
| 70–89% | WARNING | Amber |
| ≥ 90% | DANGER | Red |

Thresholds are defined as constants in `apps/backend/src/modules/budgets/api.ts` and mirrored as TypeScript constants in the frontend `types.ts`.

---

## Constitution Check (US3)

- [x] **Code Quality**: No raw SQL strings in component code; query lives in service layer.
- [x] **Architecture**: `BudgetSummary` is computed — no duplicate storage of imputation data.
- [x] **Security**: `project_manager_id` filter enforced server-side; never trust client filter.
- [x] **UX**: Colour coding meets WCAG contrast; status also conveyed via text label (not colour only).
- [x] **Performance**: Query is indexed on `project_id` + `period_month` in migration.
