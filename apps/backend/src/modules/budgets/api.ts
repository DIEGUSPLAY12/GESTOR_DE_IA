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

    // Sub from JWT — set by requireAuth middleware
    const currentUserId = req.user?.sub
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Fetch projects managed by the current user
    let projectQuery = supabase
      .from('project')
      .select('id, name, code, monthly_budget')
      .eq('project_manager_id', currentUserId)
      .is('deleted_at', null)

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

    // Aggregate allocated_cost per project for the given period
    const { data: imputations, error: imputationError } = await supabase
      .from('imputation_result')
      .select('project_id, allocated_cost')
      .eq('period_month', periodMonth)
      .in('project_id', projectIds)

    if (imputationError) throw new Error(imputationError.message)

    // Sum costs per project
    const costByProject = new Map<string, number>()
    for (const row of imputations ?? []) {
      const pid = row.project_id as string
      const cost = Number(row.allocated_cost)
      costByProject.set(pid, (costByProject.get(pid) ?? 0) + cost)
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
