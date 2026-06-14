export interface ConsultantCostView {
  id: string
  project_id: string | null
  project_name: string
  project_code: string
  account_name: string
  provider_name: string
  plan_name: string
  units_used: number
  unit_label: string
  calculated_cost: string
  currency: string
  period_month: string
}
