# Specification: US1 — Gestión de Datos Maestros y Asignaciones

**Parent Feature**: [AI Cost Manager](../spec.md)
**Priority**: P1
**Status**: Ready for implementation
**Created**: 2026-06-05

---

## User Story

Como **Administrador**, quiero poder registrar y actualizar proyectos, empleados, proveedores de IA, planes de precio (pricing), cuentas y las reglas de asignación entre estas entidades, para preparar el terreno para las imputaciones de costes.

**Why this priority**: Es la base indispensable; sin el catálogo de proyectos y cuentas de IA asignadas a personas, el cálculo de costes no puede llevarse a cabo.

---

## Acceptance Scenarios

### SC-US1-01: Alta de empleado y asignación de cuenta compartida

**Given** un nuevo empleado en Alten,
**When** el administrador lo da de alta y le asigna un 50% de una cuenta compartida de OpenAI,
**Then** esa cuenta refleja correctamente quiénes son sus titulares y el total de la asignación suma el 100%.

**Validations**:
- El porcentaje de titularidad de todos los titulares activos de una cuenta debe sumar exactamente 100% en todo momento.
- Si se añade un titular que haría superar el 100%, el sistema rechaza la operación con error claro.

---

### SC-US1-02: Asignación de consultor a múltiples proyectos

**Given** un consultor con una cuenta activa,
**When** se le asigna a dos proyectos distintos (60% y 40%),
**Then** el registro de asignación refleja los periodos de validez y su dedicación no supera el 100%.

**Validations**:
- La suma de `percentage` de `ProjectAssignment` activos para una persona no puede superar el 100%.
- Las fechas `valid_from` / `valid_to` se almacenan correctamente para permitir historificación.

---

### SC-US1-03: Eliminación lógica de entidades

**Given** un proyecto o cuenta que ya no está activo,
**When** el administrador realiza un borrado lógico,
**Then** el registro permanece en base de datos para auditoría con una fecha de cierre registrada (soft delete), y no aparece en las vistas operacionales activas.

---

## Functional Requirements (scope US1)

| ID      | Requirement                                                                                                                       | Priority |
|---------|-----------------------------------------------------------------------------------------------------------------------------------|----------|
| FR-001  | CRUD completo de: Person, Project, AiProvider, PricingPlan, AiAccount                                                            | MUST     |
| FR-002  | Asignación temporal consultor-proyecto (`ProjectAssignment`) con % de dedicación y rango de fechas                                | MUST     |
| FR-003  | Asignación de titulares de cuenta (`AccountOwnership`) con % y rango de fechas; la suma de % activos = 100%                      | MUST     |
| FR-009  | Borrado lógico (soft delete) en todas las entidades maestras — nunca borrado físico                                               | MUST     |
| FR-010  | Validación en API: % de titularidad en cuenta no supera 100%; % de dedicación en proyectos no supera 100% por persona activa     | MUST     |
| FR-011  | Filtros básicos en listados: por estado activo/inactivo, por proyecto, por proveedor                                              | SHOULD   |

---

## Key Entities (scope US1)

Defined in full in [data-model.md](../data-model.md).

- **Person**: `id`, `email`, `full_name`, `role (ADMIN|PROJECT_MANAGER|CONSULTANT)`, timestamps
- **Project**: `id`, `code`, `name`, `client_name`, `project_manager_id`, `start_date`, `end_date`, `monthly_budget (DECIMAL)`, timestamps
- **AiProvider**: `id`, `name`, timestamps
- **PricingPlan**: `id`, `provider_id`, `type (PER_SEAT|POOL_SLOT|PAY_PER_TOKEN|VOLUME_TIER)`, `name`, `unit_price (DECIMAL)`, `currency`, `effective_from`, `effective_to`
- **AiAccount**: `id`, `pricing_plan_id`, `external_identifier`, `valid_from`, `valid_to`
- **AccountOwnership** _(relational)_: `account_id`, `person_id`, `percentage (DECIMAL)`, `valid_from`, `valid_to`
- **ProjectAssignment** _(relational)_: `person_id`, `project_id`, `percentage (DECIMAL)`, `valid_from`, `valid_to`

---

## Edge Cases

1. **Porcentaje > 100% en cuenta compartida**: La API rechaza el alta del titular con `HTTP 422` y mensaje `"Total ownership would exceed 100%"`.
2. **Dedicación acumulada > 100% por persona**: La API rechaza la nueva asignación de proyecto con `HTTP 422` y mensaje `"Total allocation would exceed 100%"`.
3. **Fechas solapadas en asignaciones**: Se permite solapar rangos de fechas siempre que la suma de porcentajes no supere el 100% en ningún día del periodo.
4. **Borrado de entidad referenciada**: Si se intenta borrar lógicamente una `Person` que tiene asignaciones activas, el sistema advierte pero permite proceder, marcando las asignaciones como cerradas.

---

## Out of Scope (US1)

- Cálculo de imputaciones (US2)
- Dashboards de presupuesto (US3)
- Vista de consultor individual (US4)
- Autenticación SSO (infraestructura transversal)
