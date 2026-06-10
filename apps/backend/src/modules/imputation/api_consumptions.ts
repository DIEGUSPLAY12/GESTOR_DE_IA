import { Router } from 'express'
import multer from 'multer'
import { supabase } from '../../lib/supabase.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are accepted'))
    }
  },
})

// Validation patterns
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/
const CURRENCY_RE = /^[A-Z]{3}$/

const EXPECTED_COLUMNS = ['account_id', 'period_start', 'period_end', 'total_cost', 'currency'] as const
type ColName = (typeof EXPECTED_COLUMNS)[number]

interface ConsumptionInsert {
  account_id: string
  period_start: string
  period_end: string
  total_cost: string
  currency: string
}

// POST /api/v1/consumptions/import
// Auth: ADMIN only
// Body: multipart/form-data, field "file" = CSV
// CSV columns: account_id, period_start, period_end, total_cost, currency
// Response: { imported: number, skipped: number }
router.post(
  '/import',
  requireAuth,
  requireRole('ADMIN'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded. Use multipart field name "file".' })
        return
      }

      const csv = req.file.buffer.toString('utf-8')
      const lines = csv
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

      if (lines.length < 2) {
        res.status(400).json({
          error: 'CSV must contain a header row and at least one data row.',
        })
        return
      }

      // Locate required columns from the header
      const headerFields = lines[0]!.split(',').map((h) => h.trim().toLowerCase())
      const colIndex: Record<ColName, number> = {} as Record<ColName, number>
      const missingCols: string[] = []

      for (const col of EXPECTED_COLUMNS) {
        const idx = headerFields.indexOf(col)
        if (idx === -1) {
          missingCols.push(col)
        } else {
          colIndex[col] = idx
        }
      }

      if (missingCols.length > 0) {
        res.status(400).json({ error: `Missing CSV columns: ${missingCols.join(', ')}` })
        return
      }

      const toInsert: ConsumptionInsert[] = []
      let skipped = 0

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i]!.split(',').map((p) => p.trim())

        const accountId = parts[colIndex.account_id] ?? ''
        const periodStart = parts[colIndex.period_start] ?? ''
        const periodEnd = parts[colIndex.period_end] ?? ''
        const rawCost = parts[colIndex.total_cost] ?? ''
        const currency = (parts[colIndex.currency] ?? '').toUpperCase()

        const cost = parseFloat(rawCost)

        const isValid =
          UUID_RE.test(accountId) &&
          DATE_RE.test(periodStart) &&
          DATE_RE.test(periodEnd) &&
          !isNaN(cost) &&
          cost >= 0 &&
          CURRENCY_RE.test(currency) &&
          periodEnd >= periodStart

        if (!isValid) {
          skipped++
          continue
        }

        toInsert.push({
          account_id: accountId,
          period_start: periodStart,
          period_end: periodEnd,
          total_cost: cost.toFixed(4),
          currency,
        })
      }

      if (toInsert.length === 0) {
        res.json({ imported: 0, skipped })
        return
      }

      const { error } = await supabase.from('token_consumption').insert(toInsert)
      if (error) {
        res.status(500).json({ error: `Database insert failed: ${error.message}` })
        return
      }

      res.json({ imported: toInsert.length, skipped })
    } catch (err) {
      next(err)
    }
  },
)

export { router as consumptionsRouter }
