import { Router } from 'express'
import { createQueue, isQueueAvailable, QUEUE_NAMES } from '../../lib/queue.js'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../middleware/auth.js'
import { runImputationForPeriod } from './service.js'
import type { ImputationJobData } from './worker.js'

const router = Router()

const PERIOD_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

// POST /api/v1/imputations/calculate
// Auth: ADMIN only
// Body: { period_month: "YYYY-MM", exchange_rates?: Record<string, number>, target_currency?: string }
// Response (with Redis):    202 Accepted { jobId, periodMonth, status: "queued" }
// Response (without Redis): 200 OK       { periodMonth, status: "completed", recordsInserted }
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

      const serviceOpts = {
        periodMonth: period_month,
        ...(typeof exchange_rates === 'object' && exchange_rates !== null && !Array.isArray(exchange_rates)
          ? { exchangeRates: exchange_rates as Record<string, number> }
          : {}),
        ...(typeof target_currency === 'string' ? { targetCurrency: target_currency } : {}),
      }

      // No Redis → run synchronously and return the result directly
      if (!isQueueAvailable()) {
        const result = await runImputationForPeriod(serviceOpts)
        res.json({
          periodMonth: period_month,
          status: 'completed',
          recordsInserted: result.recordsInserted,
          auditHash: result.auditHash,
        })
        return
      }

      // Redis available → enqueue background job
      const queue = createQueue<ImputationJobData>(QUEUE_NAMES.IMPUTATION)
      const jobData: ImputationJobData = {
        requestedBy: req.user?.sub ?? 'unknown',
        ...serviceOpts,
      }
      const job = await queue.add('calculate', jobData)

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
