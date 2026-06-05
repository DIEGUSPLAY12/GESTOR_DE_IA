# Specification: US2 — Ejecución del Motor de Imputaciones

**Parent Feature**: [AI Cost Manager](../spec.md)
**Priority**: P2 — core calculation engine
**Status**: Ready for implementation
**Created**: 2026-06-05

---

## User Story

Como **Administrador**, quiero poder ejecutar el cálculo de imputación para un periodo cerrado (ej. mes anterior) o en curso, para que el sistema procese todo el coste de las cuentas de IA y lo distribuya entre los proyectos.

**Why this priority**: Es el core de cálculo de la aplicación, resolviendo el problema principal (trazabilidad del coste a nivel de proyecto).

---

## Acceptance Scenarios

### SC-US2-01: Reparto exacto de coste mensual

**Given** un mes completado y facturado,
**When** el administrador lanza la imputación mensual,
**Then** el coste de cada cuenta se reparte exactamente entre sus titulares y, proporcionalmente, a los proyectos de cada titular.

**Validations**:
- La suma de `allocatedCost` de todos los registros del periodo = suma total de coste de todas las cuentas del periodo.
- Ninguna diferencia de céntimo puede perderse (invariante SC-001 Suma Cero).
- El cálculo es reproducible: la misma entrada produce la misma salida (SC-002).

---

### SC-US2-02: Bolsa de no-imputado por consultor sin proyecto

**Given** un consultor sin proyecto durante 15 días del mes,
**When** se procesa el periodo,
**Then** la parte de su coste de IA en esos 15 días se destina a la "bolsa de no imputado" (`project_id = null`).

**Validations**:
- Los días sin asignación de proyecto se prorratean correctamente.
- El `ImputationRecord` correspondiente tiene `projectId = null`.
- El importe en la bolsa + el importe asignado a proyectos = coste total del consultor en el periodo.

---

### SC-US2-03: Importación de consumos pay-per-token

**Given** un archivo CSV con el consumo de una cuenta PAY_PER_TOKEN,
**When** el administrador lo importa via `POST /api/v1/consumptions/import`,
**Then** el sistema registra el consumo y lo usa en el siguiente cálculo de imputación.

---

## Functional Requirements (scope US2)

| ID      | Requirement                                                                                                                           | Priority |
|---------|---------------------------------------------------------------------------------------------------------------------------------------|----------|
| FR-005  | El motor distribuye el gasto prorrateando altas/bajas, pasando el coste no asignado a la "bolsa de no imputado"                      | MUST     |
| FR-004  | Registro/importación de consumo medido (PAY_PER_TOKEN) mediante CSV                                                                  | MUST     |
| FR-007  | Log de auditoría inmutable (`audit_hash`) en cada `ImputationResult`; recálculos con nueva traza                                     | MUST     |
| FR-012  | El motor MUST ser una librería pura TypeScript, sin dependencias de DB o HTTP (library-first)                                        | MUST     |
| FR-013  | El endpoint `POST /api/v1/imputations/calculate` encola el cálculo en background (202 Accepted) — no bloquea el hilo principal        | MUST     |
| FR-014  | Soporte multi-divisa: `exchangeRates` se pasan en el request; todas las salidas normalizadas a `targetCurrency`                      | SHOULD   |

---

## Key Functional Rules

### Regla de prorrateo temporal

Si una cuenta o asignación no estuvo activa todo el mes, el coste se prorratea por días:

```
coste_prorrateado = coste_total × (días_activos / días_del_periodo)
```

### Regla de split de titularidad

El coste prorrateado se distribuye entre los titulares según su `percentage` en `AccountOwnership`.

### Regla de asignación a proyecto

El coste del titular se distribuye entre sus proyectos activos según `ProjectAssignment.percentage`.
El coste restante (sin proyecto) va a la bolsa `project_id = null`.

### Invariante Suma Cero (SC-001)

```
Σ(coste de todas las cuentas) = Σ(allocatedCost de todos los ImputationRecords del periodo)
```

Esta invariante DEBE verificarse al final de cada ejecución. Si falla, la ejecución se aborta con error.

---

## Edge Cases

1. **Décimas de céntimo**: Se aplica `decimal.js` con precisión DECIMAL(19,4). El redondeo final se hace con la estrategia "last-penny" (el último céntimo se asigna al primer registro para garantizar la suma exacta).
2. **Cuenta activa desde el día 15**: Prorrateo proporcional — sólo se contabilizan los días de vigencia.
3. **Dedicación acumulada > 100%** (datos incorrectos): El motor normaliza el porcentaje total al 100% y genera un `calculationTrace` de advertencia, sin abortar.
4. **Recálculo de periodo cerrado**: Se permiten recálculos pero cada ejecución genera nuevos `ImputationResult` con `audit_hash` diferente y una traza que referencia la ejecución anterior.

---

## Out of Scope (US2)

- Dashboards de presupuesto (US3)
- Vista individual del consultor (US4)
- Notificaciones push (transversal)
- Tipos de cambio en tiempo real (se introducen manualmente por periodo)
