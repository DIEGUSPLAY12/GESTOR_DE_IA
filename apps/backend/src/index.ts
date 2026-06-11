import express from 'express'
import { createWorker, isQueueAvailable, QUEUE_NAMES } from './lib/queue.js'
import { imputationsRouter } from './modules/imputation/api.js'
import { consumptionsRouter } from './modules/imputation/api_consumptions.js'
import { peopleRouter, projectsRouter } from './modules/master-data/people_projects.js'
import { providersRouter, accountsRouter } from './modules/master-data/accounts.js'
import { budgetsRouter } from './modules/budgets/api.js'
import { consultantsRouter } from './modules/consultants/api.js'
import { reportsRouter } from './modules/reports/api.js'

const app = express()
const PORT = Number(process.env['PORT'] ?? 3000)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Module routes
app.use('/api/v1/people', peopleRouter)
app.use('/api/v1/projects', projectsRouter)
app.use('/api/v1/providers', providersRouter)
app.use('/api/v1/accounts', accountsRouter)
app.use('/api/v1/budgets', budgetsRouter)
app.use('/api/v1/imputations', imputationsRouter)
app.use('/api/v1/consumptions', consumptionsRouter)
app.use('/api/v1/consultants', consultantsRouter)
app.use('/api/v1/reports', reportsRouter)

// Imputation background worker (only when Redis is configured)
if (isQueueAvailable()) {
  import('./modules/imputation/worker.js').then(({ default: runImputationJob }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createWorker(QUEUE_NAMES.IMPUTATION, (job: any) => runImputationJob(job))
    console.log('[queue] BullMQ worker started')
  }).catch((err: unknown) => {
    console.error('[queue] Failed to start worker:', err)
  })
} else {
  console.log('[queue] Redis not configured — imputations will run synchronously')
}

app.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`)
})

export { app }
