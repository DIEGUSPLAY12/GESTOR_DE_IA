import { Router } from 'express'
import type { Response, NextFunction } from 'express'
import { supabase } from '../../lib/supabase.js'
import { requireAuth } from '../../middleware/auth.js'
import type { AuthenticatedRequest } from '../../middleware/auth.js'

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/

export interface ConsultantCostView {
  account_name: string
  provider_name: string
  period_month: string
  allocated_cost: string
  currency: string
  ownership_pct: string
  calculation_trace: string
}

const router = Router()

// GET /api/v1/consultants/me/costs?period_month=YYYY-MM
// Identity resolved server-side from JWT sub/email — never from query param
router.get(
  '/me/costs',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const periodMonth = req.query['period_month'] as string | undefined

      if (!periodMonth || !PERIOD_RE.test(periodMonth)) {
        res.status(400).json({ error: 'period_month is required and must match YYYY-MM' })
        return
      }

      const jwtSub = req.user?.sub
      const jwtEmail = req.user?.email

      if (!jwtSub) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      // Resolve person_id from JWT sub (direct UUID match) or fall back to email
      let personId: string | null = null

      // Try direct UUID match on id first
      const { data: byId } = await supabase
        .from('person')
        .select('id')
        .eq('id', jwtSub)
        .is('deleted_at', null)
        .maybeSingle()

      if (byId) {
        personId = byId.id as string
      } else if (jwtEmail) {
        const { data: byEmail } = await supabase
          .from('person')
          .select('id')
          .eq('email', jwtEmail)
          .is('deleted_at', null)
          .maybeSingle()

        if (byEmail) personId = byEmail.id as string
      }

      if (!personId) {
        res.status(403).json({ error: 'No person record found for this identity' })
        return
      }

      // Fetch imputation results with account + provider context
      const { data: results, error } = await supabase
        .from('imputation_result')
        .select(
          `
          account_id,
          allocated_cost,
          currency,
          period_month,
          calculation_trace,
          account:account_id (
            external_identifier,
            pricing_plan:pricing_plan_id (
              provider:provider_id ( name )
            )
          )
        `,
        )
        .eq('person_id', personId)
        .eq('period_month', periodMonth)
        .order('allocated_cost', { ascending: false })

      if (error) throw new Error(error.message)

      // Fetch ownership percentages for this person separately
      const { data: ownerships } = await supabase
        .from('account_ownership')
        .select('account_id, percentage')
        .eq('person_id', personId)

      const ownershipMap = new Map<string, string>()
      for (const o of ownerships ?? []) {
        ownershipMap.set(o.account_id as string, String(o.percentage))
      }

      const costs: ConsultantCostView[] = (results ?? []).map((r) => {
        const account = (r.account as unknown) as {
          external_identifier: string
          pricing_plan: { provider: { name: string } }
        } | null
        const accountId = r.account_id as string

        return {
          account_name: account?.external_identifier ?? 'Unknown',
          provider_name: account?.pricing_plan?.provider?.name ?? 'Unknown',
          period_month: r.period_month as string,
          allocated_cost: String(r.allocated_cost),
          currency: r.currency as string,
          ownership_pct: ownershipMap.get(accountId) ?? '0',
          calculation_trace: r.calculation_trace as string,
        }
      })

      res.json({ data: costs })
    } catch (err) {
      next(err)
    }
  },
)

export { router as consultantsRouter }
