export type PersonRole = 'ADMIN' | 'PROJECT_MANAGER' | 'CONSULTANT'
export type PlanType = 'PER_SEAT' | 'POOL_SLOT' | 'PAY_PER_TOKEN' | 'VOLUME_TIER'

export interface Person {
  id: string
  email: string
  full_name: string
  role: PersonRole
  created_at: string
  deleted_at: string | null
}

export interface Project {
  id: string
  code: string
  name: string
  client_name: string
  project_manager_id: string
  start_date: string
  end_date: string | null
  monthly_budget: string | null
  created_at: string
  deleted_at: string | null
}

export interface AiProvider {
  id: string
  name: string
  created_at: string
  deleted_at: string | null
}

export interface PricingPlan {
  id: string
  provider_id: string
  type: PlanType
  name: string
  unit_price: string
  currency: string
  effective_from: string
  effective_to: string | null
  deleted_at: string | null
}

export interface AiAccount {
  id: string
  pricing_plan_id: string
  external_identifier: string
  valid_from: string
  valid_to: string | null
  deleted_at: string | null
  pricing_plan?: Pick<PricingPlan, 'type' | 'name' | 'currency' | 'unit_price'>
}

export interface AccountOwnership {
  id: string
  account_id: string
  person_id: string
  percentage: string
  valid_from: string
  valid_to: string | null
  person?: Pick<Person, 'id' | 'full_name' | 'email'>
}

export interface ProjectAssignment {
  id: string
  person_id: string
  project_id: string
  percentage: string
  valid_from: string
  valid_to: string | null
}

// ─── Request/Response shapes ──────────────────────────────────────────────────

export interface CreatePersonInput {
  email: string
  full_name: string
  role?: PersonRole
}

export interface UpdatePersonInput {
  email?: string
  full_name?: string
  role?: PersonRole
}

export interface CreateProjectInput {
  code: string
  name: string
  client_name: string
  project_manager_id: string
  start_date: string
  end_date?: string
  monthly_budget?: number
}

export interface UpdateProjectInput {
  name?: string
  client_name?: string
  project_manager_id?: string
  start_date?: string
  end_date?: string
  monthly_budget?: number
}

export interface CreateAccountInput {
  pricing_plan_id: string
  external_identifier: string
  valid_from: string
  valid_to?: string
}

export interface AssignOwnerInput {
  person_id: string
  percentage: number
  valid_from: string
  valid_to?: string
}

export interface AssignProjectInput {
  project_id: string
  percentage: number
  valid_from: string
  valid_to?: string
}

export interface CreateProviderInput {
  name: string
}

export interface CreatePlanInput {
  type: PlanType
  name: string
  unit_price?: number
  currency?: string
  effective_from: string
  effective_to?: string
}

export interface DeleteAccountInput {
  id: string
}
