# Feature Specification: AI Cost Manager

**Feature Branch**: `001-ai-cost-manager`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestión de Datos Maestros y Asignaciones (Priority: P1)

Como **Administrador**, quiero poder registrar y actualizar proyectos, empleados, proveedores de IA, planes de precio (pricing), cuentas y las reglas de asignación entre estas entidades, para preparar el terreno para las imputaciones de costes.

**Why this priority**: Es la base indispensable; sin el catálogo de proyectos y cuentas de IA asignadas a personas, el cálculo de costes no puede llevarse a cabo.

**Independent Test**: Se pueden dar de alta todas las entidades (personas, cuentas, proyectos, asignaciones) y comprobar que el modelo de datos las relaciona correctamente sin ejecutar ninguna imputación.

**Acceptance Scenarios**:

1. **Given** un nuevo empleado en Alten, **When** el administrador lo da de alta y le asigna un 50% de una cuenta compartida de OpenAI, **Then** esa cuenta refleja correctamente quiénes son sus titulares y el total de la asignación suma el 100%.
2. **Given** un consultor con una cuenta activa, **When** se le asigna a dos proyectos distintos (60% y 40%), **Then** el registro de asignación refleja los periodos de validez y su dedicación no supera el 100%.

---

### User Story 2 - Ejecución del Motor de Imputaciones (Priority: P2)

Como **Administrador**, quiero poder ejecutar el cálculo de imputación para un periodo cerrado (ej. mes anterior) o en curso, para que el sistema procese todo el coste de las cuentas de IA y lo distribuya entre los proyectos.

**Why this priority**: Es el core de cálculo de la aplicación, resolviendo el problema principal (trazabilidad del coste a nivel de proyecto).

**Independent Test**: Se puede lanzar la imputación de un mes de prueba y verificar (exportando o listando) que la suma total del gasto coincide con el reparto y que no existen pérdidas ni duplicidades de céntimos.

**Acceptance Scenarios**:

1. **Given** un mes completado y facturado, **When** el administrador lanza la imputación mensual, **Then** el coste de cada cuenta se reparte exactamente entre sus titulares y, proporcionalmente, a los proyectos de cada titular.
2. **Given** un consultor sin proyecto durante 15 días del mes, **When** se procesa el periodo, **Then** la parte de su coste de IA en esos 15 días se destina a la "bolsa de no imputado".

---

### User Story 3 - Control de Presupuestos y Control de Desviaciones (Priority: P3)

Como **Jefe de proyecto**, quiero visualizar el presupuesto de IA de mi proyecto, el coste consumido en el periodo actual y recibir alertas si me acerco al límite presupuestario.

**Why this priority**: Dota de control financiero proactivo a los líderes del proyecto sin tener que depender del cierre contable de administración.

**Independent Test**: Modificar el presupuesto (ej: 100€) y simular un consumo de 95€; el sistema debe cambiar de estado y lanzar una notificación (visual o push).

**Acceptance Scenarios**:

1. **Given** un proyecto con un presupuesto de IA mensual de 500€, **When** las imputaciones de las cuentas de los consultores alcanzan los 450€, **Then** el jefe de proyecto ve en su cuadro de mando la barra de consumo en "peligro" y recibe una alerta.
2. **Given** que un jefe de proyecto entra al sistema, **When** navega al panel principal, **Then** visualiza exclusivamente la información de presupuesto y costes de sus proyectos.

---

### User Story 4 - Consulta Individual de Consumo (Priority: P4)

Como **Consultor**, quiero ver qué cuentas de IA tengo asignadas y mi consumo asociado en el periodo actual.

**Why this priority**: Otorga transparencia para que cada desarrollador entienda el impacto económico de su uso de herramientas de IA.

**Independent Test**: Un perfil con rol consultor accede a la app y puede ver solo sus propios costes, sin ninguna métrica a nivel de proyecto u otros compañeros.

**Acceptance Scenarios**:

1. **Given** un empleado autenticado sin rol de administración, **When** accede a su área personal, **Then** visualiza el coste imputado por su asiento de Copilot y el consumo asimilado por sus peticiones API.

### Edge Cases

- ¿Qué ocurre cuando el cálculo genera décimas de céntimo? Se debe aplicar una regla de redondeo contable para que la suma total sea exactamente igual al recibo original.
- ¿Qué pasa si una cuenta se crea el 15 de marzo, a mitad del periodo? El coste se prorrateará en función de los días de alta vigentes en ese periodo mensual.
- ¿Cómo se maneja si la dedicación de un consultor suma 110% por error? El sistema debe alertar al administrador o, según la regla configurada, normalizar al 100% como límite en la imputación.
- ¿Qué pasa si se alteran datos de un periodo ya cerrado? No se modificará el resultado anterior a menos que el administrador fuerce un recalculado con una traza de auditoría, emitiendo un documento de "corrección" para finanzas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir la creación, edición y borrado lógico de personas, proyectos, proveedores de IA, planes de pricing y cuentas.
- **FR-002**: El sistema MUST permitir la asignación temporal (fechas de inicio y fin) de consultores a proyectos con indicación de porcentaje de dedicación.
- **FR-003**: El sistema MUST permitir incluir múltiples titulares en una misma cuenta asignando un % a cada uno que obligatoriamente sume 100% en todo momento.
- **FR-004**: El sistema MUST poder registrar (o importar manualmente) el consumo específico medido mediante tokens o uso medido, aparte del pricing de cuota fija.
- **FR-005**: El motor de cálculo MUST distribuir el gasto prorrateando altas/bajas dentro del periodo, pasando el coste no asignado a proyectos a la "bolsa de no imputado".
- **FR-006**: El sistema MUST permitir asociar presupuestos monetarios por proyecto y reportar su grado de consumo respecto al límite.
- **FR-007**: El sistema MUST mantener un listado auditable (log de auditoría) para cualquier recalculo de periodos pasados ya cerrados, evitando la duplicidad en el reporte.
- **FR-008**: Se incluirán cuadros de mando interactivos que filtren la información por empleado, proyecto, proveedor y que ofrezcan evolución temporal.

### Key Entities

- **Persona**: El empleado. Atributos incluyen rol (Admin, JP, Consultor), y un identificador único.
- **Proyecto**: Entidad consumidora de fondos, ligada a un Jefe de Proyecto, con fechas de inicio/fin y presupuesto periódico de IA asignado.
- **Proveedor / Plan / Cuenta de IA**: Jerarquía de producto facturable. Un Proveedor (ej. OpenAI) tiene Planes de Pricing. Una Cuenta de IA se acoge a un plan y vincula un registro real de facturación.
- **Asignación a Proyecto**: Tabla puente que vincula Persona, Proyecto, Rango de fechas y % de Dedicación.
- **Titularidad de Cuenta**: Tabla puente que vincula Persona, Cuenta de IA, Rango de fechas y Responsabilidad (%).
- **Ejecución / Imputación (Log period)**: Registro de los céntimos exactos derivados de una cuenta a una persona y de esa persona a un proyecto en un periodo de tiempo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Suma Cero en Imputaciones: Al cerrar un periodo, el total del coste de todas las cuentas registradas debe ser 100.0% idéntico a (Suma de coste de Proyectos + Suma de bolsa no-imputada), sin discrepancias.
- **SC-002**: Ejecuciones reproducibles: Cualquier ejecución de recalculo bajo los mismos datos emitidos originará un exacto idéntico resultado de imputación.
- **SC-003**: Reducción de tiempo de consolidación: Reducir sustancialmente (objetivo indirecto empresarial) el tiempo en imputar horas de IA. 
- **SC-004**: Alertas Tempranas: 100% de las veces que el coste computado para un proyecto trascienda un umbral presupuestario (por ejemplo, el 80%), el sistema dejará registro visible para el rol JP de dicho proyecto.

## Assumptions

- No utilizaremos `[NEEDS CLARIFICATION]` porque las reglas de comportamiento deseadas según la descripción cubren las bases técnicas. Aceptamos los siguientes compromisos razonables:
- *Autenticación*: Asumiremos el uso del ecosistema estándar que Alten posea en el entorno donde se instale (por ejemplo SSO con Entra ID vía OAuth).
- *Almacén Divisas*: Al ser compatible con varias divisas, el tipo de cambio del periodo se introducirá manualmente por periodo aplicable (o a través de una API gratuita por defecto como fuente si se requiere sin coste extra).
- *Exportación*: Las opciones de exportación estarán dadas en formato Comma-Separated Values (CSV) u hoja de cálculo en la versión MVP, como principal integrador del cierre hacia el fin de mes financiero general.
- *Redondeo*: Los cálculos internos se llevarán en formato decimal alto, truncando o redondeando al céntimo más cercano únicamente para la agregación final.
