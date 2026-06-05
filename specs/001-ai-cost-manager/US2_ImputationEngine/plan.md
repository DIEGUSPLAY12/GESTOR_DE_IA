# Implementation Plan: US2 — Ejecución del Motor de Imputaciones

**Parent Plan**: [AI Cost Manager Plan](../plan.md)
**Spec**: [US2 spec.md](./spec.md)
**Contract**: [imputation-engine.md](../contracts/imputation-engine.md)
**Priority**: P2 — CORE
**Date**: 2026-06-05

---

## Summary

Implementar el motor de imputación como librería TypeScript pura en `packages/imputation-engine`, exponiéndolo al backend via workspace reference. El backend orquesta la obtención de datos desde Supabase y encola el job de cálculo con BullMQ. Desarrollo guiado por TDD (tests primero).

---

## Technical Context

- **Motor**: `packages/imputation-engine` — TypeScript puro, sin framework, sin DB
- **Precision**: `decimal.js` para todas las operaciones aritméticas (sin `number` nativo para importes)
- **Testing**: Vitest con cobertura ≥ 80%; tests escritos ANTES de la implementación (TDD)
- **Backend**: Node.js + Supabase SDK — orquesta datos y encola jobs
- **Queue**: BullMQ + Redis — ejecución asíncrona del cálculo pesado

---

## Architecture

### Layer 1: Imputation Engine Library (`packages/imputation-engine/src/`)

```
imputation-engine/src/
├── proration.ts      ← Prorrateo de días (días_activos / días_periodo)
├── split.ts          ← Reparto de coste entre titulares por %
├── assignment.ts     ← Distribución al proyecto o bolsa no-imputado
└── index.ts          ← Exporta calculatePeriod(request): ImputationRecord[]
```

**Invariants enforced by the engine**:
- Suma Cero: `Σ(allocatedCost) == Σ(accountCosts)` — verificado al final de `calculatePeriod()`
- Determinismo: misma entrada → misma salida (funciones puras, sin `Date.now()` interno)
- Last-penny rule: el último céntimo va al primer registro para garantizar suma exacta

### Layer 2: Backend Orchestration (`apps/backend/src/modules/imputation/`)

```
imputation/
├── service.ts          ← Queries Supabase, maps to ImputationPeriodRequest, persists results
├── api.ts              ← POST /api/v1/imputations/calculate → enqueue BullMQ job → 202
├── api_consumptions.ts ← POST /api/v1/consumptions/import → parse CSV → persist TokenConsumption
└── worker.ts           ← BullMQ worker: calls service.ts, handles errors, audit logging
```

### Layer 3: Database

Migration: `0003_imputations_schema.sql`
- `token_consumption`: importaciones de consumo PAY_PER_TOKEN
- `imputation_result`: registro inmutable con `audit_hash = SHA256(JSON(inputs))`

---

## TDD Sequence (mandatory)

Tests are written BEFORE implementation in this order:

1. `tests/proration.test.ts` → `src/proration.ts`
2. `tests/split.test.ts` → `src/split.ts`
3. `tests/assignment.test.ts` → `src/assignment.ts`
4. `tests/engine.test.ts` → `src/index.ts` (integration, validates SC-001)

Each test file targets a single functional unit. `engine.test.ts` validates the complete pipeline end-to-end with synthetic data.

---

## API Contract

From [contracts/imputation-engine.md](../contracts/imputation-engine.md):

```typescript
// Input
type ImputationPeriodRequest = {
  periodInfo: { startDate: Date; endDate: Date; targetCurrency: string; exchangeRates: Record<string, number> };
  accounts: BaseAccountData[];
  consumptions: ConsumptionData[];      // PAY_PER_TOKEN only
  ownerships: AccountOwnershipData[];
  assignments: ProjectAssignmentData[];
};

// Output
type ImputationRecord = {
  internalLogId: string;
  projectId: string | null;  // null = bolsa no-imputado
  personId: string;
  accountId: string;
  originalCost: Decimal;
  allocatedCost: Decimal;
  currency: string;
  calculationTrace: string;
};
```

---

## Constitution Check (US2)

- [x] **Code Quality**: ESLint + Prettier; no `number` arithmetic for money.
- [x] **Testing**: TDD mandatory; ≥ 80% coverage; `engine.test.ts` validates SC-001.
- [x] **Architecture**: Engine is a pure library with zero external dependencies except `decimal.js`.
- [x] **Performance**: BullMQ ensures calculation doesn't block API thread.
- [x] **Security**: `audit_hash` makes results tamper-evident.

---

## Dependency Map

```
US1 (Master Data schema) ──► US2 (Imputation Engine) ──► US3, US4 (dashboards)
Migration 0001, 0002      ──► Migration 0003
```
