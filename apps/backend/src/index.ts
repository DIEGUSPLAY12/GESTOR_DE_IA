import express from 'express'
import { createWorker, QUEUE_NAMES } from './lib/queue.js'

const app = express()
const PORT = Number(process.env['PORT'] ?? 3000)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Module routes (registered as they are implemented)
// app.use('/api/v1/people', peopleRouter)
// app.use('/api/v1/projects', projectsRouter)
// app.use('/api/v1/providers', providersRouter)
// app.use('/api/v1/accounts', accountsRouter)
// app.use('/api/v1/imputations', imputationsRouter)
// app.use('/api/v1/consumptions', consumptionsRouter)
// app.use('/api/v1/budgets', budgetsRouter)
// app.use('/api/v1/consultants', consultantsRouter)
// app.use('/api/v1/reports', reportsRouter)

// Imputation background worker
createWorker(QUEUE_NAMES.IMPUTATION, async (job) => {
  const { default: runImputationJob } = await import(
    './modules/imputation/worker.js'
  )
  await runImputationJob(job)
})

app.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`)
})

export { app }
