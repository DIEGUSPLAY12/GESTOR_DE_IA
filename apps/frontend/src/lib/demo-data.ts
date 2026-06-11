import type { Project, Person, AiProvider, PricingPlan, AiAccount } from '../features/master-data/types.js'
import type { BudgetSummary } from '../features/budgets/types.js'

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    code: 'ALT-2024-001',
    name: 'Transformación Digital Bancaria',
    client_name: 'Banco Santander',
    project_manager_id: 'person-001',
    start_date: '2024-01-15',
    end_date: null,
    monthly_budget: '1200.0000',
    created_at: '2024-01-10T00:00:00Z',
    deleted_at: null,
  },
  {
    id: 'proj-002',
    code: 'ALT-2024-002',
    name: 'IA Generativa en Atención al Cliente',
    client_name: 'Telefónica',
    project_manager_id: 'person-002',
    start_date: '2024-03-01',
    end_date: null,
    monthly_budget: '850.0000',
    created_at: '2024-02-20T00:00:00Z',
    deleted_at: null,
  },
  {
    id: 'proj-003',
    code: 'ALT-2024-003',
    name: 'Automatización de Procesos RPA',
    client_name: 'Repsol',
    project_manager_id: 'person-001',
    start_date: '2024-06-01',
    end_date: '2024-12-31',
    monthly_budget: '500.0000',
    created_at: '2024-05-15T00:00:00Z',
    deleted_at: null,
  },
  {
    id: 'proj-004',
    code: 'ALT-2025-001',
    name: 'Plataforma MLOps Corporativa',
    client_name: 'Iberdrola',
    project_manager_id: 'person-003',
    start_date: '2025-01-01',
    end_date: null,
    monthly_budget: '2000.0000',
    created_at: '2024-12-01T00:00:00Z',
    deleted_at: null,
  },
  {
    id: 'proj-005',
    code: 'ALT-2023-008',
    name: 'Análisis Predictivo de Riesgos',
    client_name: 'BBVA',
    project_manager_id: 'person-002',
    start_date: '2023-09-01',
    end_date: '2024-03-31',
    monthly_budget: '750.0000',
    created_at: '2023-08-01T00:00:00Z',
    deleted_at: '2024-04-01T00:00:00Z',
  },
]

export const DEMO_PEOPLE: Person[] = [
  {
    id: 'person-001',
    email: 'ana.garcia@alten.es',
    full_name: 'Ana García Martínez',
    role: 'PROJECT_MANAGER',
    created_at: '2023-01-01T00:00:00Z',
    deleted_at: null,
  },
  {
    id: 'person-002',
    email: 'carlos.lopez@alten.es',
    full_name: 'Carlos López Fernández',
    role: 'PROJECT_MANAGER',
    created_at: '2023-01-01T00:00:00Z',
    deleted_at: null,
  },
  {
    id: 'person-003',
    email: 'marta.ruiz@alten.es',
    full_name: 'Marta Ruiz Sánchez',
    role: 'CONSULTANT',
    created_at: '2023-03-15T00:00:00Z',
    deleted_at: null,
  },
  {
    id: 'person-004',
    email: 'david.torres@alten.es',
    full_name: 'David Torres Blanco',
    role: 'CONSULTANT',
    created_at: '2023-06-01T00:00:00Z',
    deleted_at: null,
  },
  {
    id: 'person-005',
    email: 'lucia.moreno@alten.es',
    full_name: 'Lucía Moreno Vega',
    role: 'CONSULTANT',
    created_at: '2024-01-10T00:00:00Z',
    deleted_at: null,
  },
  {
    id: 'person-006',
    email: 'admin@alten.es',
    full_name: 'Administrador Sistema',
    role: 'ADMIN',
    created_at: '2023-01-01T00:00:00Z',
    deleted_at: null,
  },
]

export const DEMO_PROVIDERS: AiProvider[] = [
  { id: 'prov-001', name: 'Anthropic', created_at: '2024-01-01T00:00:00Z', deleted_at: null },
  { id: 'prov-002', name: 'OpenAI', created_at: '2024-01-01T00:00:00Z', deleted_at: null },
  { id: 'prov-003', name: 'Microsoft (Copilot)', created_at: '2024-01-01T00:00:00Z', deleted_at: null },
  { id: 'prov-004', name: 'Google (Gemini)', created_at: '2024-01-01T00:00:00Z', deleted_at: null },
  { id: 'prov-005', name: 'Mistral AI', created_at: '2024-01-01T00:00:00Z', deleted_at: null },
  { id: 'prov-006', name: 'xAI (Grok)', created_at: '2024-06-01T00:00:00Z', deleted_at: null },
]

export const DEMO_PLANS: PricingPlan[] = [
  {
    id: 'plan-001', provider_id: 'prov-001', type: 'PAY_PER_TOKEN',
    name: 'Claude Sonnet API', unit_price: '0.0000', currency: 'USD',
    effective_from: '2024-01-01', effective_to: null, deleted_at: null,
  },
  {
    id: 'plan-002', provider_id: 'prov-002', type: 'PAY_PER_TOKEN',
    name: 'GPT-4o API', unit_price: '0.0000', currency: 'USD',
    effective_from: '2024-05-01', effective_to: null, deleted_at: null,
  },
  {
    id: 'plan-003', provider_id: 'prov-003', type: 'PER_SEAT',
    name: 'GitHub Copilot Business', unit_price: '19.0000', currency: 'USD',
    effective_from: '2024-01-01', effective_to: null, deleted_at: null,
  },
  {
    id: 'plan-004', provider_id: 'prov-003', type: 'PER_SEAT',
    name: 'Microsoft 365 Copilot', unit_price: '30.0000', currency: 'USD',
    effective_from: '2024-03-01', effective_to: null, deleted_at: null,
  },
  {
    id: 'plan-005', provider_id: 'prov-005', type: 'POOL_SLOT',
    name: 'Mistral La Plateforme Team', unit_price: '50.0000', currency: 'EUR',
    effective_from: '2024-06-01', effective_to: null, deleted_at: null,
  },
]

export const DEMO_ACCOUNTS: AiAccount[] = [
  {
    id: 'acc-001', pricing_plan_id: 'plan-003', external_identifier: 'copilot-marta@alten.es',
    valid_from: '2024-01-15', valid_to: null, deleted_at: null,
    pricing_plan: { type: 'PER_SEAT', name: 'GitHub Copilot Business', currency: 'USD', unit_price: '19.0000' },
  },
  {
    id: 'acc-002', pricing_plan_id: 'plan-003', external_identifier: 'copilot-david@alten.es',
    valid_from: '2024-03-01', valid_to: null, deleted_at: null,
    pricing_plan: { type: 'PER_SEAT', name: 'GitHub Copilot Business', currency: 'USD', unit_price: '19.0000' },
  },
  {
    id: 'acc-003', pricing_plan_id: 'plan-001', external_identifier: 'anthropic-api-shared-equipo-a',
    valid_from: '2024-01-01', valid_to: null, deleted_at: null,
    pricing_plan: { type: 'PAY_PER_TOKEN', name: 'Claude Sonnet API', currency: 'USD', unit_price: '0.0000' },
  },
  {
    id: 'acc-004', pricing_plan_id: 'plan-002', external_identifier: 'openai-api-proyecto-rpa',
    valid_from: '2024-06-01', valid_to: '2024-12-31', deleted_at: null,
    pricing_plan: { type: 'PAY_PER_TOKEN', name: 'GPT-4o API', currency: 'USD', unit_price: '0.0000' },
  },
  {
    id: 'acc-005', pricing_plan_id: 'plan-004', external_identifier: 'm365-copilot-lucia@alten.es',
    valid_from: '2025-01-01', valid_to: null, deleted_at: null,
    pricing_plan: { type: 'PER_SEAT', name: 'Microsoft 365 Copilot', currency: 'USD', unit_price: '30.0000' },
  },
]

export const DEMO_BUDGETS: BudgetSummary[] = [
  {
    project_id: 'proj-001',
    project_name: 'Transformación Digital Bancaria',
    project_code: 'ALT-2024-001',
    monthly_budget: '1200.0000',
    actual_cost: '1094.4000',
    percentage_used: 91.2,
    status: 'DANGER',
  },
  {
    project_id: 'proj-002',
    project_name: 'IA Generativa en Atención al Cliente',
    project_code: 'ALT-2024-002',
    monthly_budget: '850.0000',
    actual_cost: '637.5000',
    percentage_used: 75.0,
    status: 'WARNING',
  },
  {
    project_id: 'proj-004',
    project_name: 'Plataforma MLOps Corporativa',
    project_code: 'ALT-2025-001',
    monthly_budget: '2000.0000',
    actual_cost: '480.0000',
    percentage_used: 24.0,
    status: 'OK',
  },
  {
    project_id: 'proj-003',
    project_name: 'Automatización de Procesos RPA',
    project_code: 'ALT-2024-003',
    monthly_budget: null,
    actual_cost: '212.8000',
    percentage_used: null,
    status: 'OK',
  },
]
