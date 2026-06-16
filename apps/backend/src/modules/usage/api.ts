import { Router } from 'express'
import type { Response, NextFunction } from 'express'
import { supabase } from '../../lib/supabase.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import type { AuthenticatedRequest } from '../../middleware/auth.js'

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/

const router = Router()

// ─── Resolve person_id from JWT ───────────────────────────────────────────────

async function resolvePersonId(sub?: string, email?: string): Promise<string | null> {
  if (sub) {
    const { data } = await supabase
      .from('person')
      .select('id')
      .eq('id', sub)
      .is('deleted_at', null)
      .maybeSingle()
    if (data) return data.id as string
  }

  if (email) {
    const { data } = await supabase
      .from('person')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle()
    if (data) return data.id as string
  }

  return null
}

// ─── POST /api/v1/usage ───────────────────────────────────────────────────────

interface LogUsageBody {
  account_id: string
  project_id: string
  units_used: number
  unit_label?: string
  notes?: string
  period_month: string
}

router.post('/', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      account_id,
      project_id,
      units_used,
      unit_label,
      notes,
      period_month,
    } = req.body as LogUsageBody

    if (!account_id || !project_id || !period_month) {
      res.status(400).json({ error: 'account_id, project_id and period_month are required' })
      return
    }

    if (typeof units_used !== 'number' || units_used <= 0) {
      res.status(400).json({ error: 'units_used must be a positive number' })
      return
    }

    if (!PERIOD_RE.test(period_month)) {
      res.status(400).json({ error: 'period_month must match YYYY-MM' })
      return
    }

    const personId = await resolvePersonId(req.user?.sub, req.user?.email)
    if (!personId) {
      res.status(403).json({ error: 'No person record found for this identity' })
      return
    }

    // Fetch unit_price from the account's pricing plan
    const { data: account, error: accountError } = await supabase
      .from('ai_account')
      .select('id, pricing_plan:pricing_plan_id (unit_price, currency)')
      .eq('id', account_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (accountError) throw new Error(accountError.message)
    if (!account) {
      res.status(404).json({ error: 'Account not found' })
      return
    }

    const plan = (account.pricing_plan as unknown) as { unit_price: string; currency: string } | null
    if (!plan) {
      res.status(422).json({ error: 'Account has no associated pricing plan' })
      return
    }

    const unitPrice = Number(plan.unit_price)
    const calculatedCost = Math.round(units_used * unitPrice * 10000) / 10000

    const insertRow: Record<string, unknown> = {
      person_id: personId,
      account_id,
      project_id,
      units_used,
      calculated_cost: calculatedCost,
      currency: plan.currency,
      period_month,
      ...(unit_label !== undefined ? { unit_label } : {}),
      ...(notes !== undefined ? { notes } : {}),
    }

    const { data: created, error: insertError } = await supabase
      .from('usage_log')
      .insert(insertRow)
      .select('id, person_id, account_id, project_id, units_used, unit_label, calculated_cost, currency, period_month, notes, created_at')
      .single()

    if (insertError) throw new Error(insertError.message)

    res.status(201).json({ data: created })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/v1/usage/me?period_month=YYYY-MM ───────────────────────────────

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const periodMonth = req.query['period_month'] as string | undefined

    if (!periodMonth || !PERIOD_RE.test(periodMonth)) {
      res.status(400).json({ error: 'period_month is required and must match YYYY-MM' })
      return
    }

    const personId = await resolvePersonId(req.user?.sub, req.user?.email)
    if (!personId) {
      res.status(403).json({ error: 'No person record found for this identity' })
      return
    }

    const { data, error } = await supabase
      .from('usage_log')
      .select(`
        id,
        units_used,
        unit_label,
        calculated_cost,
        currency,
        period_month,
        notes,
        created_at,
        account:account_id (
          external_identifier,
          pricing_plan:pricing_plan_id (
            name,
            type,
            provider:provider_id ( name )
          )
        ),
        project:project_id (
          code,
          name
        )
      `)
      .eq('person_id', personId)
      .eq('period_month', periodMonth)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    res.json({ data: data ?? [] })
  } catch (err) {
    next(err)
  }
})

export { router as usageRouter }
