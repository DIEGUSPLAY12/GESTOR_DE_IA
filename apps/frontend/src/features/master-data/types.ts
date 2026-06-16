export type PersonRole = 'ADMIN' | 'PROJECT_MANAGER' | 'CONSULTANT'
export type PlanType = 'PER_SEAT' | 'PAY_PER_TOKEN' | 'POOL_SLOT' | 'VOLUME_TIER'
export type IqpValue = '3.1' | '3.2' | '4' | '5'
export const IQP_OPTIONS: IqpValue[] = ['3.1', '3.2', '4', '5']

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
  delivery_manager_id: string | null
  project_leader_id: string | null
  project_leader_2_id: string | null
  start_date: string
  end_date: string | null
  monthly_budget: string | null
  total_budget: string | null
  iqp: IqpValue | null
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
  price_per_input_token: string | null
  price_per_output_token: string | null
  contracted_at: string | null
  activated_at: string | null
  deleted_at: string | null
}

export interface AiAccount {
  id: string
  pricing_plan_id: string
  external_identifier: string
  valid_from: string
  valid_to: string | null
  deleted_at: string | null
  pricing_plan?: Pick<PricingPlan, 'type' | 'name' | 'currency' | 'unit_price'> & {
    provider?: { name: string }
  }
}

export interface MySubscription {
  id: string
  account_id: string
  valid_from: string
  account: {
    id: string
    external_identifier: string
    valid_to: string | null
    pricing_plan: {
      id: string
      name: string
      type: PlanType
      unit_price: string
      currency: string
      provider: { name: string } | null
    } | null
  } | null
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
  valid_from: string
  valid_to: string | null
  project?: Pick<Project, 'id' | 'code' | 'name' | 'start_date' | 'end_date'>
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
  delivery_manager_id?: string
  project_leader_id?: string
  project_leader_2_id?: string
  start_date: string
  end_date?: string
  monthly_budget?: number
  total_budget?: number
  iqp?: IqpValue
}

export interface UpdateProjectInput {
  name?: string
  client_name?: string
  project_manager_id?: string
  delivery_manager_id?: string
  project_leader_id?: string
  project_leader_2_id?: string
  start_date?: string
  end_date?: string
  monthly_budget?: number
  total_budget?: number
  iqp?: IqpValue
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

export interface JoinProjectInput {
  projectId: string
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
  price_per_input_token?: number
  price_per_output_token?: number
  contracted_at?: string
  activated_at?: string
}

export interface ProjectAiAccount {
  account_id: string
  identifier: string
  provider_name: string
  plan_name: string
  plan_type: string
  total_cost: number
  currency: string
  valid_from: string
  valid_to: string | null
  by_period: { period_month: string; cost: number }[]
}

export interface DeleteAccountInput {
  id: string
}

export interface ProjectUsageEntry {
  id: string
  units_used: number
  unit_label: string
  calculated_cost: string
  currency: string
  period_month: string
  notes: string | null
  created_at: string
  account: {
    external_identifier: string
    pricing_plan: {
      name: string
      unit_price: string
      provider: { name: string } | null
    } | null
  } | null
}

export interface AddProjectUsageInput {
  projectId: string
  account_id: string
  hours: number
  period_month: string
}

export interface UpdateProjectUsageInput {
  projectId: string
  usageId: string
  hours: number
}
