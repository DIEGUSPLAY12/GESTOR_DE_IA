# Tasks: US2 — Ejecución del Motor de Imputaciones

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Contract**: [../contracts/imputation-engine.md](../contracts/imputation-engine.md)
**Parent tasks**: [../../tasks.md](../../tasks.md) — T010–T021
**Strategy**: TDD obligatorio — cada test se escribe ANTES de su implementación. Orden: proration → split → assignment → engine E2E → API layer.

---

## Phase A: Database Migration

- [X] A001 [US2] Escribir migración `0003_imputations_schema.sql` con DECIMAL(19,4) para `token_consumption` e `imputation_result` en `apps/backend/supabase/migrations/0003_imputations_schema.sql`
  - `imputation_result.audit_hash`: `TEXT NOT NULL` — SHA256 del JSON de entrada
  - `imputation_result.project_id`: `UUID NULLABLE` (null = bolsa no-imputado)
  - Index on `(project_id, period_month)` and `(person_id, period_month)`

---

## Phase B: Engine — TDD Layer (tests first, then implementation)

- [X] B001 [US2] **TEST** Crear `packages/imputation-engine/tests/proration.test.ts`
  - Case: cuenta activa 15 de 31 días → coste = totalCost × 15/31
  - Case: cuenta activa todo el mes → coste = totalCost × 1.0
  - Case: cuenta sin días activos → coste = Decimal('0')

- [X] B002 [US2] **IMPL** Implementar función de prorrateo en `packages/imputation-engine/src/proration.ts`
  - Signature: `prorateAccount(account: BaseAccountData, period: PeriodInfo): Decimal`
  - Must pass all B001 tests

- [X] B003 [US2] **TEST** Crear `packages/imputation-engine/tests/split.test.ts`
  - Case: cuenta 200€ entre 4 titulares al 25% cada uno → cada uno recibe 50.0000€
  - Case: distribución con céntimos fraccionarios → suma total exacta (last-penny rule)
  - Case: único titular al 100% → recibe el total exacto

- [X] B004 [US2] **IMPL** Implementar split entre titulares en `packages/imputation-engine/src/split.ts`
  - Signature: `splitByOwnership(cost: Decimal, ownerships: AccountOwnershipData[]): OwnerShare[]`
  - Uses `decimal.js`; last-penny applied to first owner
  - Must pass all B003 tests

- [X] B005 [US2] **TEST** Crear `packages/imputation-engine/tests/assignment.test.ts`
  - Case: consultor asignado al 60% proyecto A y 40% proyecto B → distribución correcta
  - Case: consultor sin proyecto en todo el periodo → 100% a bolsa (projectId = null)
  - Case: consultor con 15 días en proyecto A, 16 días en proyecto B → prorrateo temporal

- [X] B006 [US2] **IMPL** Implementar asignación de coste al proyecto o bolsa en `packages/imputation-engine/src/assignment.ts`
  - Signature: `assignToProjects(ownerCost: Decimal, personId: string, assignments: ProjectAssignmentData[], period: PeriodInfo): ImputationRecord[]`
  - Must pass all B005 tests

- [X] B007 [US2] **TEST** Crear `packages/imputation-engine/tests/engine.test.ts` — E2E validando SC-001
  - Case: periodo completo multi-cuenta, multi-titular → Suma Cero exacta
  - Case: bolsa no-imputado correctamente calculada
  - Case: mismo input × 2 → outputs idénticos (determinismo SC-002)

- [X] B008 [US2] **IMPL** Ensamblar `calculatePeriod()` en `packages/imputation-engine/src/index.ts`
  - Signature: `calculatePeriod(request: ImputationPeriodRequest): ImputationRecord[]`
  - Calls proration → split → assignment in sequence
  - Post-condition: verifies Suma Cero invariant; throws if violated

---

## Phase C: Backend API Layer

- [X] C001 [US2] Implementar `apps/backend/src/modules/imputation/service.ts`
  - Queries Supabase for period accounts, ownerships, assignments, consumptions
  - Maps DB rows to `ImputationPeriodRequest`
  - Calls `calculatePeriod()` from engine
  - Persists `ImputationResult` rows with `audit_hash = SHA256(JSON(request))`

- [X] C002 [P] [US2] Crear `apps/backend/src/modules/imputation/api.ts`
  - `POST /api/v1/imputations/calculate` — Auth: Admin only
  - Body: `{ period_month: "YYYY-MM" }`
  - Enqueues BullMQ job → returns `202 Accepted`

- [X] C003 [P] [US2] Crear `apps/backend/src/modules/imputation/api_consumptions.ts`
  - `POST /api/v1/consumptions/import` — multipart CSV upload
  - Parses CSV, persists `TokenConsumption` rows
  - Returns `{ imported: N, skipped: M }`

---

## Acceptance Criteria Cross-Check

| Scenario | Tasks covering it |
|----------|--------------------|
| SC-US2-01: Suma Cero exacta | B001–B008, C001 |
| SC-US2-02: Bolsa no-imputado | B005, B006, B007, B008 |
| SC-US2-03: Importación CSV | C003 |
| SC-001 invariante | B007, B008 |
| SC-002 determinismo | B007 |
