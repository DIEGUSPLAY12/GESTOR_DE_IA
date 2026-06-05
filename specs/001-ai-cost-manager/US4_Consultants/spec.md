# Specification: US4 — Consulta Individual de Consumo

**Parent Feature**: [AI Cost Manager](../spec.md)
**Priority**: P4
**Status**: Ready for implementation
**Created**: 2026-06-05

---

## User Story

Como **Consultor**, quiero ver qué cuentas de IA tengo asignadas y mi consumo asociado en el periodo actual.

**Why this priority**: Otorga transparencia para que cada desarrollador entienda el impacto económico de su uso de herramientas de IA.

---

## Acceptance Scenarios

### SC-US4-01: Vista de consumo personal

**Given** un empleado autenticado sin rol de administración,
**When** accede a su área personal,
**Then** visualiza el coste imputado por su asiento de Copilot y el consumo asimilado por sus peticiones API.

**Validations**:
- Sólo se muestran datos del usuario autenticado (filtrado por `person_id = JWT sub`).
- No se exponen datos de costes de compañeros ni de totales de proyecto.
- Los datos muestran: nombre de cuenta, proveedor, coste imputado en el periodo, porcentaje de titularidad.

---

## Functional Requirements (scope US4)

| ID      | Requirement                                                                                                | Priority |
|---------|------------------------------------------------------------------------------------------------------------|----------|
| FR-019  | Endpoint seguro `GET /api/v1/consultants/me/costs` que filtra por `person_id` del JWT                     | MUST     |
| FR-020  | Dashboard `ConsultantDashboard` que muestre cuentas asignadas y coste por periodo                         | MUST     |
| FR-021  | Los datos son de sólo lectura para el rol Consultor — sin acciones de edición                              | MUST     |
| FR-022  | La identidad del consultor se resuelve del token Entra ID (JWT `sub` claim)                               | MUST     |

---

## Key Entities (scope US4)

- **AiAccount** + **AccountOwnership** + **PricingPlan**: para mostrar qué cuentas y a qué coste
- **ImputationResult**: fuente de verdad del coste real imputado al consultor en el periodo
- **ConsultantCostView** (computed): `{ account_name, provider_name, period_month, allocated_cost, ownership_percentage }`

---

## Edge Cases

1. **Consultor sin cuentas asignadas**: La vista muestra estado vacío con mensaje informativo.
2. **Periodo sin imputaciones ejecutadas**: Se muestra 0€ para el periodo actual.
3. **Consultor con múltiples cuentas** (Copilot + API): Cada cuenta aparece como fila separada.

---

## Out of Scope (US4)

- Comparativa histórica multiperiodo (MVP muestra sólo periodo actual)
- Acceso a datos de otros consultores o proyectos
- Exportación CSV desde la vista de consultor (sólo disponible para Admin)
