# Modelo de Datos: Gestor de Costes IA

## Entidades Principales

### Person (Persona)
Empleado de la organización, sincronizado o gestionado en plataforma.
- `id`: UUID (PK)
- `email`: string (Unique)
- `full_name`: string
- `role`: enum ('ADMIN', 'PROJECT_MANAGER', 'CONSULTANT')
- `created_at`, `updated_at`

### Project (Proyecto)
Centro de costes a donde se derivan los gastos de IA.
- `id`: UUID (PK)
- `client_name`: string
- `name`: string
- `code`: string (Unique, e.g., 'PRJ-123')
- `project_manager_id`: UUID (FK to Person)
- `start_date`: Date
- `end_date`: Date (nullable)
- `monthly_budget`: DECIMAL(19,4) (Presupuesto máximo de IA mensual)
- `created_at`, `updated_at`

### AiProvider (Proveedor de IA)
Ejemplo: OpenAI, Anthropic, Mistral.
- `id`: UUID (PK)
- `name`: string
- `created_at`, `updated_at`

### PricingPlan (Plan de Precios)
Reglas de coste temporalmente vigentes de un producto.
- `id`: UUID (PK)
- `provider_id`: UUID (FK to AiProvider)
- `type`: enum ('PER_SEAT', 'POOL_SLOT', 'PAY_PER_TOKEN', 'VOLUME_TIER')
- `name`: string (e.g., 'Copilot Business', 'GPT-4 API')
- `unit_price`: DECIMAL(19,4)
- `currency`: string (e.g., 'EUR', 'USD')
- `effective_from`: Date
- `effective_to`: Date (nullable)

### AiAccount (Cuenta de IA)
La licencia abstracta o registro físico que incurre en gasto.
- `id`: UUID (PK)
- `pricing_plan_id`: UUID (FK to PricingPlan)
- `external_identifier`: string (e.g., mail de la licencia o tenant id)
- `valid_from`: Date
- `valid_to`: Date (nullable)

## Entidades Relacionales e Históricas (Fechas Efectivas)

### AccountOwnership (Titularidad de Cuenta)
Quién(es) usan una cuenta compartida o individual, en qué rango de fechas, y su % de propiedad.
- `id`: UUID (PK)
- `account_id`: UUID (FK to AiAccount)
- `person_id`: UUID (FK to Person)
- `percentage`: DECIMAL(5,2) (0-100)
- `valid_from`: Date
- `valid_to`: Date (nullable)

### ProjectAssignment (Asignación a Proyecto)
El tiempo y dedicación de un consultor en un proyecto.
- `id`: UUID (PK)
- `person_id`: UUID (FK to Person)
- `project_id`: UUID (FK to Project)
- `percentage`: DECIMAL(5,2) (0-100)
- `valid_from`: Date
- `valid_to`: Date (nullable)

### TokenConsumption (Consumo de Pago por Uso)
Importación de logs para cuentas facturadas por métricas variables (`PAY_PER_TOKEN`).
- `id`: UUID (PK)
- `account_id`: UUID (FK to AiAccount)
- `period_start`: Date
- `period_end`: Date
- `total_cost`: DECIMAL(19,4)
- `currency`: string

## Outputs del Motor / Log de Imputaciones

### ImputationResult (Resultado de Imputación)
Registro inmutable del cruce contable tras un cierre mensual.
- `id`: UUID (PK)
- `period_month`: string (e.g., '2026-05')
- `project_id`: UUID (FK to Project, Nullable para bolsa 'no-imputado')
- `person_id`: UUID (FK to Person)
- `account_id`: UUID (FK to AiAccount)
- `allocated_cost`: DECIMAL(19,4)
- `currency`: string (e.g., 'EUR' estandarizado)
- `calculated_at`: Timestamp
- `audit_hash`: string (firmado o checksum de inmutabilidad)
