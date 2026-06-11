export type BudgetStatus = 'OK' | 'WARNING' | 'DANGER'

export interface BudgetSummary {
  project_id: string
  project_name: string
  project_code: string
  monthly_budget: string | null
  actual_cost: string
  percentage_used: number | null
  status: BudgetStatus
}

export const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  OK: 'En presupuesto',
  WARNING: 'Advertencia',
  DANGER: 'Peligro',
}

export const BUDGET_STATUS_COLOR: Record<BudgetStatus, string> = {
  OK: 'green',
  WARNING: 'amber',
  DANGER: 'red',
}
