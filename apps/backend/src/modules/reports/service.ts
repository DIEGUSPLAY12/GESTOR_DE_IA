import { supabase } from '../../lib/supabase.js'

export interface ReportFilters {
  periodMonth?: string
  projectId?: string
  personId?: string
}

interface UsageLogRow {
  id: string
  period_month: string
  project_id: string | null
  person_id: string
  account_id: string
  units_used: number
  unit_label: string | null
  calculated_cost: string
  currency: string
  notes: string | null
  created_at: string
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
  'units_used',
  'unit_label',
  'calculated_cost',
  'currency',
  'notes',
  'created_at',
]

export async function exportImputationsCsv(filters: ReportFilters): Promise<string> {
  let query = supabase
    .from('usage_log')
    .select(
      `
      id,
      period_month,
      project_id,
      person_id,
      account_id,
      units_used,
      unit_label,
      calculated_cost,
      currency,
      notes,
      created_at,
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
    .order('created_at', { ascending: false })

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

  const rows = (data ?? []) as unknown as UsageLogRow[]

  const lines: string[] = [CSV_HEADERS.join(',')]

  for (const r of rows) {
    const providerName = r.account?.pricing_plan?.provider?.name ?? ''
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
        csvCell(String(r.units_used)),
        csvCell(r.unit_label),
        csvCell(r.calculated_cost),
        csvCell(r.currency),
        csvCell(r.notes),
        csvCell(r.created_at),
      ].join(','),
    )
  }

  return lines.join('\r\n')
}
