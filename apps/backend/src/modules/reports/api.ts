import { Router } from 'express'
import type { Response, NextFunction } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import type { AuthenticatedRequest } from '../../middleware/auth.js'
import { exportImputationsCsv } from './service.js'

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const router = Router()

// GET /api/v1/reports/export
// Query: ?period_month=YYYY-MM (optional) &project_id=UUID (optional) &person_id=UUID (optional)
// Auth: ADMIN only
// Returns: CSV file download
router.get(
  '/export',
  requireAuth,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { period_month, project_id, person_id } = req.query as Record<string, string | undefined>

      if (period_month && !PERIOD_RE.test(period_month)) {
        res.status(400).json({ error: 'period_month must match YYYY-MM' })
        return
      }
      if (project_id && !UUID_RE.test(project_id)) {
        res.status(400).json({ error: 'project_id must be a valid UUID' })
        return
      }
      if (person_id && !UUID_RE.test(person_id)) {
        res.status(400).json({ error: 'person_id must be a valid UUID' })
        return
      }

      const csv = await exportImputationsCsv({
        ...(period_month ? { periodMonth: period_month } : {}),
        ...(project_id ? { projectId: project_id } : {}),
        ...(person_id ? { personId: person_id } : {}),
      })

      const filename = period_month
        ? `imputaciones_${period_month}.csv`
        : 'imputaciones_export.csv'

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(csv)
    } catch (err) {
      next(err)
    }
  },
)

export { router as reportsRouter }
