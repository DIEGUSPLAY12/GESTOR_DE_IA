---
description: "Task list template for feature implementation"
---

# Tasks: AI Cost Manager

**Input**: Design documents from `/specs/001-ai-cost-manager/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Strategy**: TDD obligatorio en el Motor de Imputación. Separación vertical en capas (Modelo/Migraciones -> Motor (tests primero) -> API -> Frontend). La generación documental de las Historias de Usuario contará con sus propias carpetas detalladas de task/plan/specify.

## Phase 1: Setup & Domain Documentation

**Purpose**: Project initialization, monorepo scaffold, and detailed documentation structure per user story.

- [X] T001 Initialize monorepo workspace for `apps/backend`, `apps/frontend`, and `packages/imputation-engine`
- [X] T002 Develop sub-documentation folders for US: `specs/001-ai-cost-manager/US1_MasterData/` with its own `spec.md`, `plan.md`, `tasks.md`
- [X] T003 [P] Develop sub-documentation folders for US: `specs/001-ai-cost-manager/US2_ImputationEngine/` with its own `spec.md`, `plan.md`, `tasks.md`
- [X] T004 [P] Develop sub-documentation folders for US: `specs/001-ai-cost-manager/US3_Budgets/` and `US4_Consultants/` identically
- [X] T005 Configurar TypeScript, ESLint y Prettier en el entorno respetando las reglas de la Constitución de Calidad en la raíz del monorepo
- [X] T006 Inicializar API Node.js con Supabase SDK local en `apps/backend` y sistema de colas en segundo plano
- [X] T007 [P] Inicializar SPA estática con React, Vite y Tailwind/accessible-components en `apps/frontend`

## Phase 2: Foundational (Data Model & Migrations)

**Purpose**: Base de esquema relacional obligatorio antes de empezar las lógicas de negocio.

- [X] T008 [US1] Escribir script de migración para las tablas maestras (Person, Project, AiProvider, PricingPlan) en `apps/backend/supabase/migrations/0001_master_schema.sql`
- [X] T009 [US1] Escribir script de migración para asignación (AiAccount, AccountOwnership, ProjectAssignment) con fechas en `apps/backend/supabase/migrations/0002_assignment_schema.sql`
- [X] T010 [US2] Escribir script de migración con precisión DECIMAL(19,4) para registro inmutable (ImputationResult) y Consumos (TokenConsumption) en `apps/backend/supabase/migrations/0003_imputations_schema.sql`

## Phase 3: User Story 2 - Ejecución del Motor de Imputaciones (Priority: P2) 🏎️ CORE

**Goal**: Proveer el motor TDD "Library-First" y su comunicación, garantizando precisión monetaria total y suma cero en imputaciones.

**-> Capa de Motor de Imputación (TDD)**
- [X] T011 [US2] Crear test unitario TDD que valide el prorrateo de días en cuenta activa en `packages/imputation-engine/tests/proration.test.ts`
- [X] T012 [US2] Implementar la función de prorrateo temporal usando y validando las fechas efectivas en `packages/imputation-engine/src/proration.ts`
- [X] T013 [US2] Crear test unitario TDD para el reparto entre usuarios (ej: cuenta de 200€ entre 4 al 25%) verificando céntimos perdidos en `packages/imputation-engine/tests/split.test.ts`
- [X] T014 [US2] Implementar la lógica del split compartido vía `decimal.js` en `packages/imputation-engine/src/split.ts`
- [X] T015 [US2] Crear test unitario TDD para la regla de bolsa no-imputado vs dedicación >100% en `packages/imputation-engine/tests/assignment.test.ts`
- [X] T016 [US2] Implementar la asignación de coste del consultor al proyecto o bolsa en `packages/imputation-engine/src/assignment.ts`
- [X] T017 [US2] Ensamblar tests de TDD End-to-End del motor abstracto validando el SC-001 (Suma cero) en `packages/imputation-engine/tests/engine.test.ts`
- [X] T018 [US2] Ensamblar el calculador global `calculatePeriod()` exportado como lib pura en `packages/imputation-engine/src/index.ts`

**-> Capa de Endpoints API**
- [X] T019 [US2] Crear el servicio de consumo de DB que inyecta datos al motor en `apps/backend/src/modules/imputation/service.ts`
- [X] T020 [US2] Crear el REST Endpoint `POST /api/v1/imputations/calculate` y encolar el job background en `apps/backend/src/modules/imputation/api.ts`
- [X] T021 [US2] Crear Endpoint para validación manual de importaciones de consumos extra (`POST /api/v1/consumptions/import`) en `apps/backend/src/modules/imputation/api_consumptions.ts`

## Phase 4: User Story 1 - Gestión de Datos Maestros y Asignaciones (Priority: P1)

**Goal**: Permitir carga y visualización de recursos a través de la interfaz.

**-> Capa de Endpoints API**
- [X] T022 [US1] Crear servicios y Endpoints CRUD en backend para Personas y Proyectos en `apps/backend/src/modules/master-data/people_projects.ts`
- [X] T023 [P] [US1] Crear servicios y Endpoints CRUD para Proveedores, Planes y Cuentas de IA en `apps/backend/src/modules/master-data/accounts.ts`

**-> Capa de Frontend y Cuadros**
- [ ] T024 [P] [US1] Armar la integración de estado de servidor (TanStack Query hooks) en `apps/frontend/src/features/master-data/api/hooks.ts`
- [ ] T025 [US1] Crear componente accesible Tabla/Filtro para control de Proyectos en `apps/frontend/src/features/master-data/components/ProjectsTable.tsx`
- [ ] T026 [P] [US1] Crear formularios de asignación de consultor-proyecto respetando control UX de % máximo en `apps/frontend/src/features/master-data/components/AssignmentForm.tsx`

## Phase 5: User Story 3 - Control de Presupuestos (Priority: P3)

**Goal**: Dashboards de líderes de proyecto.

**-> Capa de Frontend y Cuadros**
- [ ] T027 [US3] Crear API Endpoint para consultas de budget en `apps/backend/src/modules/budgets/api.ts`
- [ ] T028 [US3] Desarrollar Dashboard SPA de presupuestos comparativos vía TanStack Query y Recharts en `apps/frontend/src/features/budgets/components/BudgetDashboard.tsx`
- [ ] T029 [P] [US3] Implementar tarjeta visual de Alertas de Desviación en el dashboard en `apps/frontend/src/features/budgets/components/DeviationsAlert.tsx`

## Phase 6: User Story 4 - Consulta Individual (Priority: P4)

**Goal**: Visibilidad para consultores individuales sobre su huella.

- [ ] T030 [US4] Endpoint seguro de acceso a datos individuales del JWT Entra ID logueado en `apps/backend/src/modules/consultants/api.ts`
- [ ] T031 [P] [US4] Implementar el layout de consumo para los consultores (`ConsultantDashboard.tsx`) en `apps/frontend/src/features/consultants/components/ConsultantDashboard.tsx`

## Phase 7: Informes y Exportaciones (Cross-Cutting Polish)

**Goal**: Trazabilidad hacia finanzas y auditoría.

- [ ] T032 Generar el exportador a formato CSV (según Research) de los `ImputationResults` auditados en `apps/backend/src/modules/reports/service.ts`
- [ ] T033 Implementar el Endpoint `GET /api/v1/reports/export` filtrado por fecha en `apps/backend/src/modules/reports/api.ts`
- [ ] T034 [P] Añadir el botón en el Dashboard de Admin para descargar CSVs financieros en `apps/frontend/src/features/reports/components/ExportPanel.tsx`
- [ ] T035 Levantar tests end-to-end (Playwright) ejecutando flujo: [Alta Master] -> [Asignación] -> [Cálculo] -> [Exportar] en `apps/frontend/tests/e2e/core_flow.spec.ts`
