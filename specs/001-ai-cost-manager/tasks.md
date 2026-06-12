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
- [X] T024 [P] [US1] Armar la integración de estado de servidor (TanStack Query hooks) en `apps/frontend/src/features/master-data/api/hooks.ts`
- [X] T025 [US1] Crear componente accesible Tabla/Filtro para control de Proyectos en `apps/frontend/src/features/master-data/components/ProjectsTable.tsx`
- [X] T026 [P] [US1] Crear formularios de asignación de consultor-proyecto respetando control UX de % máximo en `apps/frontend/src/features/master-data/components/AssignmentForm.tsx`

## Phase 4b: User Story 1 — Frontend Admin (pantallas faltantes)

**Goal**: Completar la interfaz de administración para que el ciclo completo sea operable desde la web sin tocar la API directamente.

**-> Gestión de Proveedores y Planes**
- [X] T036 [US1] Crear panel de gestión de Proveedores de IA en `apps/frontend/src/features/master-data/components/ProvidersPanel.tsx`
  - Tabla de proveedores con botón Añadir y soft-delete
  - Al expandir un proveedor, muestra sus planes de pricing (nombre, tipo, precio/unidad, vigencia)
  - Formulario inline para crear nuevo proveedor y nuevo plan (`POST /api/v1/providers` y `POST /api/v1/providers/:id/plans`)
  - Integrar en la pestaña "Datos Maestros" junto a Proyectos

**-> Gestión de Cuentas de IA**
- [X] T037 [US1] Crear panel de gestión de Cuentas de IA en `apps/frontend/src/features/master-data/components/AccountsPanel.tsx`
  - Tabla de cuentas con: identificador externo, plan asociado, proveedor, fechas de vigencia, estado
  - Formulario de alta (`POST /api/v1/accounts`): selector de plan, identificador, valid_from/to
  - Soft-delete con confirmación
  - Hooks ya disponibles en `hooks.ts` (`useAccounts`, `useCreateAccount`)

**-> Asignación de Titulares a Cuentas**
- [X] T038 [P] [US1] Crear formulario `OwnershipForm` en `apps/frontend/src/features/master-data/components/OwnershipForm.tsx`
  - Dentro del detalle de una cuenta, lista sus titulares actuales con % y fechas
  - Formulario para añadir titular: selector de persona, % (con guardia ≤ 100% igual que AssignmentForm), valid_from/to
  - Usa `useAssignOwner()` y muestra error 422 inline
  - Añadir hook `useAccountOwners(accountId)` ya existe en `hooks.ts`

**-> Motor de Imputación — Disparador UI**
- [X] T039 [US2] Crear panel de cálculo de imputaciones en `apps/frontend/src/features/imputation/components/ImputationPanel.tsx`
  - Selector de periodo (`YYYY-MM`) + botón "Calcular imputaciones"
  - Llama a `POST /api/v1/imputations/calculate` con `{ period_month }`
  - Muestra estado del job: encolado → procesando → completado/error (polling con TanStack Query o SSE)
  - Al completar, invalida la caché de presupuestos automáticamente
  - Disponible en la sección "Informes" o como acción en el Dashboard de presupuestos

**-> Importación CSV de Consumos (PAY_PER_TOKEN)**
- [X] T040 [P] [US2] Crear formulario de importación CSV en `apps/frontend/src/features/imputation/components/ConsumptionImport.tsx`
  - Input `<input type="file" accept=".csv">` con drag-and-drop opcional
  - Submit hace `multipart/form-data POST /api/v1/consumptions/import`
  - Muestra resultado: `{ imported: N, skipped: M }` con detalle de filas omitidas
  - Situar junto al disparador de cálculo (T039)

## Phase 5: User Story 3 - Control de Presupuestos (Priority: P3)

**Goal**: Dashboards de líderes de proyecto.

**-> Capa de Frontend y Cuadros**
- [X] T027 [US3] Crear API Endpoint para consultas de budget en `apps/backend/src/modules/budgets/api.ts`
- [X] T028 [US3] Desarrollar Dashboard SPA de presupuestos comparativos vía TanStack Query y Recharts en `apps/frontend/src/features/budgets/components/BudgetDashboard.tsx`
- [X] T029 [P] [US3] Implementar tarjeta visual de Alertas de Desviación en el dashboard en `apps/frontend/src/features/budgets/components/DeviationsAlert.tsx`

## Phase 6: User Story 4 - Consulta Individual (Priority: P4)

**Goal**: Visibilidad para consultores individuales sobre su huella.

- [X] T030 [US4] Endpoint seguro de acceso a datos individuales del JWT Entra ID logueado en `apps/backend/src/modules/consultants/api.ts`
- [X] T031 [P] [US4] Implementar el layout de consumo para los consultores (`ConsultantDashboard.tsx`) en `apps/frontend/src/features/consultants/components/ConsultantDashboard.tsx`

## Phase 7: Informes y Exportaciones (Cross-Cutting Polish)

**Goal**: Trazabilidad hacia finanzas y auditoría.

- [X] T032 Generar el exportador a formato CSV (según Research) de los `ImputationResults` auditados en `apps/backend/src/modules/reports/service.ts`
- [X] T033 Implementar el Endpoint `GET /api/v1/reports/export` filtrado por fecha en `apps/backend/src/modules/reports/api.ts`
- [X] T034 [P] Añadir el botón en el Dashboard de Admin para descargar CSVs financieros en `apps/frontend/src/features/reports/components/ExportPanel.tsx`
- [X] T035 Levantar tests end-to-end (Playwright) ejecutando flujo: [Alta Master] -> [Asignación] -> [Cálculo] -> [Exportar] en `apps/frontend/tests/e2e/core_flow.spec.ts`

## Phase 8: Autenticación con Supabase Auth

**Goal**: Reemplazar el bypass de desarrollo por un sistema de login/registro real usando Supabase Auth. Todas las rutas quedan protegidas. El diseño visual actual no cambia.

**Dependencias de instalación (hacer antes de T041)**:
```bash
pnpm --filter @gestor-ia/frontend add @supabase/supabase-js
```
Y añadir a `apps/frontend/.env` (crear si no existe):
```
VITE_SUPABASE_URL=https://pjunxtmyaeubnkqqzaav.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key del proyecto>
```

- [X] T041 Crear cliente Supabase en frontend y actualizar middleware de backend para verificar tokens reales
  - Crear `apps/frontend/src/lib/supabase.ts` — `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`
  - Actualizar `apps/backend/src/middleware/auth.ts`: reemplazar verificación JWKS por `supabase.auth.getUser(token)` que devuelve el usuario Supabase; mantener `DEV_SKIP_AUTH` como escape hatch
  - Actualizar `apps/backend/src/lib/supabase.ts` si hace falta para exponer el cliente en el middleware
  - El `req.user.sub` debe ser el UUID de Supabase Auth (ya es un UUID válido)

- [X] T042 Añadir endpoint `GET /api/v1/auth/me` — perfil del usuario autenticado
  - Crear `apps/backend/src/modules/auth/api.ts` con `router.get('/me', requireAuth, ...)`
  - Buscar `person` por `email` del token Supabase; si no existe, crear registro `person` automáticamente con `role = 'CONSULTANT'`
  - Devolver `{ id, email, full_name, role }` — el frontend lo usará para saber el rol
  - Registrar la ruta en `apps/backend/src/index.ts` como `/api/v1/auth`

- [X] T043 Crear `AuthContext` y hook `useAuth` en el frontend
  - Crear `apps/frontend/src/lib/AuthContext.tsx` — Provider que envuelve la app con la sesión Supabase
  - Exponer: `session`, `user`, `signIn(email, password)`, `signUp(email, password, fullName)`, `signOut()`
  - `signIn` guarda el `access_token` en `sessionStorage` (compatibilidad con `api.ts` existente)
  - `onAuthStateChange` para detectar expiración/logout automático
  - Crear hook `useCurrentUser()` en `apps/frontend/src/lib/useCurrentUser.ts` que llama a `/api/v1/auth/me` con TanStack Query y expone `{ person, isAdmin, isLoading }`

- [X] T044 Crear `LoginPage.tsx` y `RegisterPage.tsx`
  - `apps/frontend/src/routes/LoginPage.tsx` — formulario email + contraseña; usa `useAuth().signIn`; redirige a `/` tras éxito; muestra errores inline
  - `apps/frontend/src/routes/RegisterPage.tsx` — formulario nombre completo + email + contraseña; usa `useAuth().signUp`; llama a `/api/v1/auth/me` tras registro para crear el `person`; redirige a `/`
  - Diseño coherente con el resto de la app (Tailwind, mismo estilo de formularios)

- [X] T045 Proteger rutas y actualizar `App.tsx` con navegación por roles
  - Crear componente `ProtectedRoute` — redirige a `/login` si no hay sesión activa
  - Envolver todas las rutas existentes con `ProtectedRoute`
  - Añadir rutas públicas `/login` y `/register` (accesibles sin sesión)
  - Actualizar `NavBar`: mostrar email del usuario + botón "Cerrar sesión" (llama a `signOut`)
  - Ocultar "Datos maestros" e "Informes" en el NavBar a usuarios no-admin
  - Añadir enlace "Mi área" para usuarios no-admin que apunta a `/dashboard`

## Phase 9: Panel de Usuario (no-admin)

**Goal**: Dar a los usuarios con rol CONSULTANT/PROJECT_MANAGER una pantalla propia donde puedan ver sus proyectos activos, registrar el uso de sus herramientas de IA y ver su historial de costes.

- [X] T046 Migración `0004_usage_log.sql` — tabla de registro de uso de IA
  - Crear `apps/backend/supabase/migrations/0004_usage_log.sql`
  - Tabla `usage_log`: `id UUID PK`, `person_id UUID → person`, `account_id UUID → ai_account`, `project_id UUID → project`, `units_used DECIMAL(19,4) NOT NULL` (horas u otras unidades), `unit_label TEXT DEFAULT 'hours'`, `calculated_cost DECIMAL(19,4) NOT NULL`, `currency CHAR(3) DEFAULT 'EUR'`, `period_month CHAR(7)`, `notes TEXT`, `created_at TIMESTAMPTZ DEFAULT now()`
  - RLS: solo el propio usuario puede leer/insertar sus filas; ADMIN puede leer todo
  - Ejecutar en Supabase SQL Editor

- [X] T047 Backend endpoints de registro de uso: `POST /api/v1/usage` y `GET /api/v1/usage/me`
  - Crear `apps/backend/src/modules/usage/api.ts`
  - `POST /api/v1/usage` — requireAuth; body: `{ account_id, project_id, units_used, unit_label?, notes?, period_month }`; calcula `calculated_cost = pricing_plan.unit_price × units_used`; inserta en `usage_log`
  - `GET /api/v1/usage/me?period_month=YYYY-MM` — requireAuth; devuelve las entradas propias con join a account + project
  - Registrar en `index.ts` como `/api/v1/usage`

- [X] T048 [P] Frontend hooks de uso en `apps/frontend/src/features/usage/api/hooks.ts`
  - `useMyUsage(periodMonth)` — GET `/api/v1/usage/me`
  - `useLogUsage()` — mutation POST `/api/v1/usage`; invalida `['usage', periodMonth]` y `['budgets', periodMonth]`

- [X] T049 Crear `UsageForm.tsx` — formulario para que el usuario registre uso de IA
  - `apps/frontend/src/features/usage/components/UsageForm.tsx`
  - Selectores: proyecto (solo los que el usuario tiene asignados), cuenta de IA (las activas)
  - Campo: unidades usadas + etiqueta (horas por defecto) + notas opcionales + período
  - Preview en tiempo real del coste calculado: `unidades × precio_plan`
  - Al enviar usa `useLogUsage()`; muestra confirmación con coste registrado

- [X] T050 Crear `UsageHistory.tsx` — historial de uso del usuario
  - `apps/frontend/src/features/usage/components/UsageHistory.tsx`
  - Tabla: fecha, proyecto, cuenta de IA, unidades, coste, moneda
  - Fila de totales en `tfoot`
  - Usa `useMyUsage(periodMonth)`

- [X] T051 Crear `UserDashboard.tsx` — página principal para usuarios no-admin
  - `apps/frontend/src/routes/UserDashboard.tsx`
  - Ruta `/dashboard`
  - Sección superior: resumen del período (total horas registradas, total coste)
  - Sección izquierda: `UsageForm` para registrar nueva entrada
  - Sección derecha: `UsageHistory` con el historial del período seleccionado

## Phase 10: Presupuesto real con usage_log

**Goal**: El dashboard de presupuestos refleja tanto los costes del motor de imputación como los registros manuales de uso.

- [ ] T052 Actualizar `budgets/api.ts` para incluir `usage_log` en el cálculo de coste real
  - En el endpoint `GET /api/v1/budgets`, además de sumar `imputation_result.allocated_cost`, sumar también `usage_log.calculated_cost` agrupado por `project_id` y `period_month`
  - El `actual_cost` final = suma imputaciones + suma usage_log

- [ ] T053 Actualizar `BudgetDashboard.tsx` para mostrar presupuesto total / gastado / restante
  - Añadir tarjetas de resumen encima de la gráfica: "Presupuesto total", "Gasto acumulado", "Restante"
  - El "Restante" = monthly_budget − actual_cost (con color verde/rojo según sea positivo/negativo)
  - La tabla accesible de `<details>` ya existente añade columna "Restante"
