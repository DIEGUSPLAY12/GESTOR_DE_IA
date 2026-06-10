import { Router } from 'express'
import { createQueue, QUEUE_NAMES } from '../../lib/queue.js'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../middleware/auth.js'
import type { ImputationJobData } from './worker.js'

const router = Router()
const imputationQueue = createQueue<ImputationJobData>(QUEUE_NAMES.IMPUTATION)

const PERIOD_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

// POST /api/v1/imputations/calculate
// Auth: ADMIN only
// Body: { period_month: "YYYY-MM", exchange_rates?: Record<string, number>, target_currency?: string }
// Response: 202 Accepted { jobId, periodMonth, status: "queued" }
router.post(
  '/calculate',
  requireAuth,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const body = req.body as Record<string, unknown>
      const { period_month, exchange_rates, target_currency } = body

      if (typeof period_month !== 'string' || !PERIOD_MONTH_RE.test(period_month)) {
        res.status(400).json({ error: 'period_month must be in YYYY-MM format (e.g. "2026-01")' })
        return
      }

      const jobData: ImputationJobData = {
        periodMonth: period_month,
        requestedBy: req.user?.sub ?? 'unknown',
        ...(typeof exchange_rates === 'object' && exchange_rates !== null && !Array.isArray(exchange_rates)
          ? { exchangeRates: exchange_rates as Record<string, number> }
          : {}),
        ...(typeof target_currency === 'string' ? { targetCurrency: target_currency } : {}),
      }

      const job = await imputationQueue.add('calculate', jobData)

      res.status(202).json({
        jobId: job.id,
        periodMonth: period_month,
        status: 'queued',
      })
    } catch (err) {
      next(err)
    }
  },
)

export { router as imputationsRouter }
