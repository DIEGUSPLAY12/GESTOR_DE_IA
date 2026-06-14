import { Router } from 'express'
import type { Response, NextFunction } from 'express'
import { supabase } from '../../lib/supabase.js'
import { requireAuth } from '../../middleware/auth.js'
import type { AuthenticatedRequest } from '../../middleware/auth.js'

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/

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

      // Fetch usage_log entries for this person (optionally filtered by period)
      let query = supabase
        .from('usage_log')
        .select(`
          id,
          project_id,
          units_used,
          unit_label,
          calculated_cost,
          currency,
          period_month,
          account:account_id (
            external_identifier,
            pricing_plan:pricing_plan_id (
              name,
              provider:provider_id ( name )
            )
          ),
          project:project_id (
            code,
            name
          )
        `)
        .eq('person_id', personId)
        .order('period_month', { ascending: false })

      if (periodMonth !== 'all') {
        query = query.eq('period_month', periodMonth)
      }

      const { data: results, error } = await query

      if (error) throw new Error(error.message)

      type AccountJoin = { external_identifier: string; pricing_plan: { name: string; provider: { name: string } | null } | null } | null
      type ProjectJoin = { code: string; name: string } | null

      const costs: ConsultantCostView[] = (results ?? []).map((r) => {
        const account = (r.account as unknown) as AccountJoin
        const project = (r.project as unknown) as ProjectJoin

        return {
          id: r.id as string,
          project_id: r.project_id as string | null,
          project_name: project?.name ?? 'Sin proyecto',
          project_code: project?.code ?? '—',
          account_name: account?.external_identifier ?? '—',
          provider_name: account?.pricing_plan?.provider?.name ?? '—',
          plan_name: account?.pricing_plan?.name ?? '—',
          units_used: Number(r.units_used),
          unit_label: r.unit_label as string,
          calculated_cost: String(r.calculated_cost),
          currency: r.currency as string,
          period_month: r.period_month as string,
        }
      })

      res.json({ data: costs })
    } catch (err) {
      next(err)
    }
  },
)

export { router as consultantsRouter }
