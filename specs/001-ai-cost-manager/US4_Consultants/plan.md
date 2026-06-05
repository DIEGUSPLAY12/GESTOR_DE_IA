# Implementation Plan: US4 — Consulta Individual de Consumo

**Parent Plan**: [AI Cost Manager Plan](../plan.md)
**Spec**: [US4 spec.md](./spec.md)
**Priority**: P4
**Date**: 2026-06-05

---

## Summary

Exponer un endpoint seguro de sólo lectura que devuelva el detalle de costes imputados al consultor autenticado, y construir el componente de dashboard individual en el frontend.

---

## Technical Context

- **Auth**: JWT de Entra ID — el `sub` claim identifica al `person.id` o se mapea vía `person.email`
- **Backend**: endpoint `GET /api/v1/consultants/me/costs` filtra `ImputationResult` por `person_id`
- **Frontend**: `ConsultantDashboard.tsx` — layout de sólo lectura con tabla de cuentas y costes

---

## Architecture

### Backend (`apps/backend/src/modules/consultants/`)

```
consultants/
└── api.ts   ← GET /api/v1/consultants/me/costs?period_month=YYYY-MM
```

Query logic:
```sql
SELECT
  ir.allocated_cost,
  ir.currency,
  ir.period_month,
  ir.calculation_trace,
  aa.external_identifier  AS account_name,
  ap.name                  AS provider_name,
  ao.percentage            AS ownership_pct
FROM imputation_result ir
JOIN ai_account aa ON aa.id = ir.account_id
JOIN pricing_plan pp ON pp.id = aa.pricing_plan_id
JOIN ai_provider ap ON ap.id = pp.provider_id
JOIN account_ownership ao ON ao.account_id = ir.account_id
  AND ao.person_id = ir.person_id
WHERE ir.person_id = :current_person_id
  AND ir.period_month = :period
```

Identity resolution: `current_person_id` is resolved from JWT `sub` (or `email`) claim via middleware before reaching the handler. If no matching `Person` row exists, return `HTTP 403`.

### Frontend (`apps/frontend/src/features/consultants/`)

```
consultants/
├── components/
│   └── ConsultantDashboard.tsx   ← Read-only table: account, provider, period, cost, ownership %
└── api/
    └── hooks.ts                  ← useMyConsultantCosts(periodMonth)
```

---

## Constitution Check (US4)

- [x] **Security**: `person_id` resolved server-side from JWT — never passed as a client query param.
- [x] **Architecture**: Reuses `ImputationResult` — no duplicate cost storage for consultants.
- [x] **UX**: Read-only view; no mutation controls rendered for Consultant role.
- [x] **Privacy**: Only the authenticated consultant's own data is exposed (GDPR principle of data minimisation).
