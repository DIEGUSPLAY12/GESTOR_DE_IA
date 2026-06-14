import { Router } from 'express'
import { supabase } from '../../lib/supabase.js'
import { requireAuth } from '../../middleware/auth.js'
import type { AuthenticatedRequest } from '../../middleware/auth.js'
import type { Response, NextFunction } from 'express'

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/

export type BudgetStatus = 'OK' | 'WARNING' | 'DANGER'

const THRESHOLD_WARNING = 70
const THRESHOLD_DANGER = 90

function computeStatus(percentageUsed: number): BudgetStatus {
  if (percentageUsed >= THRESHOLD_DANGER) return 'DANGER'
  if (percentageUsed >= THRESHOLD_WARNING) return 'WARNING'
  return 'OK'
}

export interface BudgetSummary {
  project_id: string
  project_name: string
  project_code: string
  monthly_budget: string | null
  actual_cost: string
  percentage_used: number | null
  status: BudgetStatus
}

const router = Router()

// GET /api/v1/budgets?period_month=YYYY-MM
// Optional: ?project_id=UUID for single-project detail
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const periodMonth = req.query['period_month'] as string | undefined
    const projectId = req.query['project_id'] as string | undefined

    if (!periodMonth || !PERIOD_RE.test(periodMonth)) {
      res.status(400).json({ error: 'period_month is required and must match YYYY-MM' })
      return
    }

    const currentUserId = req.user?.sub
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const isAdmin = req.user?.roles?.includes('ADMIN') ?? false

    // ADMINs see all projects; everyone else sees projects they manage OR are assigned to.
    // person.id is a DB-generated UUID — it is NOT the same as req.user.sub (auth UUID),
    // so we always resolve the person row first when scoping is needed.
    let projectQuery = supabase
      .from('project')
      .select('id, name, code, monthly_budget')
      .is('deleted_at', null)

    if (!isAdmin) {
      const userEmail = req.user?.email ?? ''
      const { data: personRow } = await supabase
        .from('person')
        .select('id')
        .eq('email', userEmail)
        .is('deleted_at', null)
        .maybeSingle()

      const personId = personRow ? (personRow as { id: string }).id : null

      const assignedProjectIds: string[] = []
      if (personId) {
        const { data: assignments } = await supabase
          .from('project_assignment')
          .select('project_id')
          .eq('person_id', personId)
          .is('valid_to', null)
        assignedProjectIds.push(
          ...((assignments ?? []).map((a) => (a as { project_id: string }).project_id)),
        )
      }

      if (personId && assignedProjectIds.length > 0) {
        // Show projects they manage (by DB person id) OR are actively assigned to
        projectQuery = projectQuery.or(
          `project_manager_id.eq.${personId},id.in.(${assignedProjectIds.join(',')})`,
        )
      } else if (personId) {
        projectQuery = projectQuery.eq('project_manager_id', personId)
      } else {
        // Person record not found — return nothing
        res.json({ data: [] })
        return
      }
    }

    if (projectId) {
      projectQuery = projectQuery.eq('id', projectId)
    }

    const { data: projects, error: projectError } = await projectQuery
    if (projectError) throw new Error(projectError.message)
    if (!projects || projects.length === 0) {
      res.json({ data: [] })
      return
    }

    const projectIds = projects.map((p) => p.id as string)

    // Fetch both cost sources in parallel
    const [imputationRes, usageRes] = await Promise.all([
      supabase
        .from('imputation_result')
        .select('project_id, allocated_cost')
        .eq('period_month', periodMonth)
        .in('project_id', projectIds),
      supabase
        .from('usage_log')
        .select('project_id, calculated_cost')
        .eq('period_month', periodMonth)
        .in('project_id', projectIds),
    ])

    if (imputationRes.error) throw new Error(imputationRes.error.message)
    if (usageRes.error) throw new Error(usageRes.error.message)

    // Sum costs per project: imputation_result + usage_log
    const costByProject = new Map<string, number>()

    for (const row of imputationRes.data ?? []) {
      const pid = row.project_id as string
      costByProject.set(pid, (costByProject.get(pid) ?? 0) + Number(row.allocated_cost))
    }

    for (const row of usageRes.data ?? []) {
      const pid = row.project_id as string
      costByProject.set(pid, (costByProject.get(pid) ?? 0) + Number(row.calculated_cost))
    }

    const summaries: BudgetSummary[] = projects.map((p) => {
      const actualCost = costByProject.get(p.id as string) ?? 0
      const budget = p.monthly_budget != null ? Number(p.monthly_budget) : null

      let percentageUsed: number | null = null
      if (budget != null && budget > 0) {
        percentageUsed = Math.round((actualCost / budget) * 10000) / 100
      }

      return {
        project_id: p.id as string,
        project_name: p.name as string,
        project_code: p.code as string,
        monthly_budget: p.monthly_budget != null ? String(p.monthly_budget) : null,
        actual_cost: actualCost.toFixed(4),
        percentage_used: percentageUsed,
        status: computeStatus(percentageUsed ?? 0),
      }
    })

    if (projectId) {
      res.json({ data: summaries[0] ?? null })
    } else {
      res.json({ data: summaries })
    }
  } catch (err) {
    next(err)
  }
})

export { router as budgetsRouter }
