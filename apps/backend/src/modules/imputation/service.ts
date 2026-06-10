import { createHash } from 'node:crypto'
import Decimal from 'decimal.js'
import { supabase } from '../../lib/supabase.js'
import { calculatePeriod } from '@gestor-ia/imputation-engine'
import type { ImputationPeriodRequest, PlanType } from '@gestor-ia/imputation-engine'

// ─── DB row types ─────────────────────────────────────────────────────────────

interface PricingPlanRow {
  type: string
  unit_price: string
  currency: string
}

interface AccountRow {
  id: string
  valid_from: string
  valid_to: string | null
  pricing_plan: PricingPlanRow
}

interface OwnershipRow {
  id: string
  account_id: string
  person_id: string
  percentage: string
  valid_from: string
  valid_to: string | null
}

interface AssignmentRow {
  id: string
  person_id: string
  project_id: string
  percentage: string
  valid_from: string
  valid_to: string | null
}

interface ConsumptionRow {
  id: string
  account_id: string
  total_cost: string
  currency: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function parsePeriodMonth(periodMonth: string): { startDate: Date; endDate: Date } {
  const [yearStr, monthStr] = periodMonth.split('-')
  const year = parseInt(yearStr!, 10)
  const month = parseInt(monthStr!, 10)
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0))  // day 0 = last day of the month
  return { startDate, endDate }
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function hashRequest(request: ImputationPeriodRequest): string {
  const serialized = JSON.stringify(request, (_key, value: unknown) => {
    if (value instanceof Decimal) return value.toFixed(4)
    if (value instanceof Date) return value.toISOString().slice(0, 10)
    return value
  })
  return createHash('sha256').update(serialized).digest('hex')
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface ImputationServiceOptions {
  periodMonth: string
  exchangeRates?: Record<string, number>
  targetCurrency?: string
}

export interface ImputationServiceResult {
  recordsInserted: number
  auditHash: string
  periodMonth: string
}

export async function runImputationForPeriod(
  options: ImputationServiceOptions,
): Promise<ImputationServiceResult> {
  const { periodMonth, exchangeRates = {}, targetCurrency = 'EUR' } = options
  const { startDate, endDate } = parsePeriodMonth(periodMonth)
  const periodStartStr = toDateStr(startDate)
  const periodEndStr = toDateStr(endDate)

  // 1. Active accounts with their pricing plans
  const { data: accountData, error: accountError } = await supabase
    .from('ai_account')
    .select('id, valid_from, valid_to, pricing_plan:pricing_plan_id(type, unit_price, currency)')
    .is('deleted_at', null)
    .lte('valid_from', periodEndStr)
    .or(`valid_to.is.null,valid_to.gte.${periodStartStr}`)

  if (accountError) throw new Error(`Failed to fetch accounts: ${accountError.message}`)

  const accountRows = (accountData ?? []) as unknown as AccountRow[]
  if (accountRows.length === 0) {
    return { recordsInserted: 0, auditHash: '', periodMonth }
  }

  const accountIds = accountRows.map((a) => a.id)

  // 2. Account ownerships active during the period
  const { data: ownershipData, error: ownershipError } = await supabase
    .from('account_ownership')
    .select('id, account_id, person_id, percentage, valid_from, valid_to')
    .in('account_id', accountIds)
    .lte('valid_from', periodEndStr)
    .or(`valid_to.is.null,valid_to.gte.${periodStartStr}`)

  if (ownershipError) throw new Error(`Failed to fetch ownerships: ${ownershipError.message}`)

  const ownershipRows = (ownershipData ?? []) as OwnershipRow[]

  // 3. Project assignments active during the period
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('project_assignment')
    .select('id, person_id, project_id, percentage, valid_from, valid_to')
    .lte('valid_from', periodEndStr)
    .or(`valid_to.is.null,valid_to.gte.${periodStartStr}`)

  if (assignmentError) throw new Error(`Failed to fetch assignments: ${assignmentError.message}`)

  const assignmentRows = (assignmentData ?? []) as AssignmentRow[]

  // 4. Token consumptions for PAY_PER_TOKEN accounts
  const payPerTokenIds = accountRows
    .filter((a) => a.pricing_plan.type === 'PAY_PER_TOKEN')
    .map((a) => a.id)

  const consumptionRows: ConsumptionRow[] = []
  if (payPerTokenIds.length > 0) {
    const { data: consumptionData, error: consumptionError } = await supabase
      .from('token_consumption')
      .select('id, account_id, total_cost, currency')
      .in('account_id', payPerTokenIds)
      .lte('period_start', periodEndStr)
      .gte('period_end', periodStartStr)

    if (consumptionError) throw new Error(`Failed to fetch consumptions: ${consumptionError.message}`)
    consumptionRows.push(...((consumptionData ?? []) as ConsumptionRow[]))
  }

  // 5. Map DB rows to ImputationPeriodRequest
  const request: ImputationPeriodRequest = {
    periodInfo: { startDate, endDate, targetCurrency, exchangeRates },
    accounts: accountRows.map((a) => ({
      id: a.id,
      planType: a.pricing_plan.type as PlanType,
      unitPrice: new Decimal(a.pricing_plan.unit_price),
      currency: a.pricing_plan.currency,
      validFrom: new Date(a.valid_from),
      validTo: a.valid_to ? new Date(a.valid_to) : null,
    })),
    consumptions: consumptionRows.map((c) => ({
      id: c.id,
      accountId: c.account_id,
      totalCost: new Decimal(c.total_cost),
      currency: c.currency,
    })),
    ownerships: ownershipRows.map((o) => ({
      id: o.id,
      accountId: o.account_id,
      personId: o.person_id,
      percentage: new Decimal(o.percentage),
      validFrom: new Date(o.valid_from),
      validTo: o.valid_to ? new Date(o.valid_to) : null,
    })),
    assignments: assignmentRows.map((a) => ({
      id: a.id,
      personId: a.person_id,
      projectId: a.project_id,
      percentage: new Decimal(a.percentage),
      validFrom: new Date(a.valid_from),
      validTo: a.valid_to ? new Date(a.valid_to) : null,
    })),
  }

  // 6. Run the engine (SC-001 Suma Cero validated inside calculatePeriod)
  const auditHash = hashRequest(request)
  const records = calculatePeriod(request)

  if (records.length === 0) {
    return { recordsInserted: 0, auditHash, periodMonth }
  }

  // 7. Persist immutable results
  const insertPayload = records.map((r) => ({
    period_month: periodMonth,
    project_id: r.projectId,
    person_id: r.personId,
    account_id: r.accountId,
    original_cost: r.originalCost.toFixed(4),
    allocated_cost: r.allocatedCost.toFixed(4),
    currency: r.currency,
    calculation_trace: r.calculationTrace,
    audit_hash: auditHash,
  }))

  const { error: insertError } = await supabase.from('imputation_result').insert(insertPayload)
  if (insertError) throw new Error(`Failed to persist imputation results: ${insertError.message}`)

  return { recordsInserted: records.length, auditHash, periodMonth }
}
