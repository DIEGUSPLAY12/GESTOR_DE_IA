import { supabase } from '../../lib/supabase.js'

export interface ReportFilters {
  periodMonth?: string
  projectId?: string
  personId?: string
}

interface ImputationRow {
  id: string
  period_month: string
  project_id: string | null
  person_id: string
  account_id: string
  allocated_cost: string
  currency: string
  audit_hash: string
  calculated_at: string
  calculation_trace: string
  person?: { full_name: string; email: string } | null
  project?: { code: string; name: string } | null
  account?: {
    external_identifier: string
    pricing_plan?: {
      name: string
      provider?: { name: string } | null
    } | null
  } | null
}

// Escapes a value for CSV: wraps in quotes, doubles internal quotes
function csvCell(value: string | null | undefined): string {
  const s = value == null ? '' : String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

const CSV_HEADERS = [
  'id',
  'period_month',
  'person_email',
  'person_name',
  'project_code',
  'project_name',
  'account_identifier',
  'provider_name',
  'plan_name',
  'allocated_cost',
  'currency',
  'audit_hash',
  'calculated_at',
  'calculation_trace',
]

export async function exportImputationsCsv(filters: ReportFilters): Promise<string> {
  let query = supabase
    .from('imputation_result')
    .select(
      `
      id,
      period_month,
      project_id,
      person_id,
      account_id,
      allocated_cost,
      currency,
      audit_hash,
      calculated_at,
      calculation_trace,
      person:person_id ( full_name, email ),
      project:project_id ( code, name ),
      account:account_id (
        external_identifier,
        pricing_plan:pricing_plan_id (
          name,
          provider:provider_id ( name )
        )
      )
    `,
    )
    .order('period_month', { ascending: false })
    .order('calculated_at', { ascending: false })

  if (filters.periodMonth) {
    query = query.eq('period_month', filters.periodMonth)
  }
  if (filters.projectId) {
    query = query.eq('project_id', filters.projectId)
  }
  if (filters.personId) {
    query = query.eq('person_id', filters.personId)
  }

  const { data, error } = await query
  if (error) throw new Error(`Export query failed: ${error.message}`)

  const rows = (data ?? []) as unknown as ImputationRow[]

  const lines: string[] = [CSV_HEADERS.join(',')]

  for (const r of rows) {
    const providerName =
      (r.account?.pricing_plan?.provider?.name) ?? ''
    const planName = r.account?.pricing_plan?.name ?? ''

    lines.push(
      [
        csvCell(r.id),
        csvCell(r.period_month),
        csvCell(r.person?.email),
        csvCell(r.person?.full_name),
        csvCell(r.project?.code),
        csvCell(r.project?.name),
        csvCell(r.account?.external_identifier),
        csvCell(providerName),
        csvCell(planName),
        csvCell(r.allocated_cost),
        csvCell(r.currency),
        csvCell(r.audit_hash),
        csvCell(r.calculated_at),
        csvCell(r.calculation_trace),
      ].join(','),
    )
  }

  return lines.join('\r\n')
}
