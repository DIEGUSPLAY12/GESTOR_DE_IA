# Specification: US3 — Control de Presupuestos y Desviaciones

**Parent Feature**: [AI Cost Manager](../spec.md)
**Priority**: P3
**Status**: Ready for implementation
**Created**: 2026-06-05

---

## User Story

Como **Jefe de proyecto**, quiero visualizar el presupuesto de IA de mi proyecto, el coste consumido en el periodo actual y recibir alertas si me acerco al límite presupuestario.

**Why this priority**: Dota de control financiero proactivo a los líderes del proyecto sin tener que depender del cierre contable de administración.

---

## Acceptance Scenarios

### SC-US3-01: Alerta visual de desviación de presupuesto

**Given** un proyecto con un presupuesto de IA mensual de 500€,
**When** las imputaciones de las cuentas de los consultores alcanzan los 450€ (90%),
**Then** el jefe de proyecto ve en su cuadro de mando la barra de consumo en estado "peligro" y recibe una alerta visual.

**Thresholds**:
- Verde: consumo < 70% del presupuesto
- Amarillo (advertencia): 70% ≤ consumo < 90%
- Rojo (peligro): consumo ≥ 90%

**Validations**:
- El estado del indicador cambia automáticamente al recalcular el periodo.
- SC-004: el 100% de las veces que se supera el umbral del 80%, queda registro visible para el JP.

---

### SC-US3-02: Visibilidad exclusiva de proyectos propios

**Given** que un jefe de proyecto entra al sistema,
**When** navega al panel principal,
**Then** visualiza exclusivamente la información de presupuesto y costes de sus proyectos.

**Validations**:
- El backend filtra por `project_manager_id = current_user.id` antes de devolver datos.
- No se exponen datos de proyectos de otros JPs.

---

## Functional Requirements (scope US3)

| ID      | Requirement                                                                                                     | Priority |
|---------|-----------------------------------------------------------------------------------------------------------------|----------|
| FR-006  | Asociar presupuesto monetario (`monthly_budget`) por proyecto y reportar grado de consumo vs. límite           | MUST     |
| FR-015  | Dashboard SPA con gráfico comparativo presupuesto vs. coste real por proyecto (Recharts)                        | MUST     |
| FR-016  | Tarjeta de Alerta de Desviación con estado visual (verde/amarillo/rojo) basado en % consumido                  | MUST     |
| FR-017  | Endpoint `GET /api/v1/budgets` filtra datos por `project_manager_id` del token JWT                             | MUST     |
| FR-018  | Los datos se actualizan tras cada ejecución de imputación (TanStack Query invalidación de caché)                | SHOULD   |

---

## Key Entities (scope US3)

- **Project.monthly_budget**: `DECIMAL(19,4)` — presupuesto mensual de IA
- **ImputationResult** (readonly): fuente de verdad del coste real por proyecto/periodo
- **BudgetSummary** (computed): `{ project_id, period_month, budget, actual_cost, percentage_used, status }`

`BudgetSummary` no se persiste; se calcula en tiempo de consulta agregando `ImputationResult` por proyecto/periodo.

---

## Edge Cases

1. **Proyecto sin presupuesto configurado**: El dashboard muestra "Sin límite" y no activa alertas.
2. **Periodo sin imputaciones ejecutadas**: El coste real es 0€; el estado del indicador es verde.
3. **Presupuesto modificado retroactivamente**: El cálculo de porcentaje usará siempre el `monthly_budget` vigente en el momento de la consulta.

---

## Out of Scope (US3)

- Vista individual del consultor (US4)
- Notificaciones push externas (correo/Slack)
- Histórico multiperiodo en dashboard MVP (se mostrará sólo el periodo actual)
