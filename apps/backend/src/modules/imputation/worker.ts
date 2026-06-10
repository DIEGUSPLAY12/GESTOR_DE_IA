import type { Job } from 'bullmq'
import { runImputationForPeriod } from './service.js'

export interface ImputationJobData {
  periodMonth: string
  requestedBy: string
  exchangeRates?: Record<string, number>
  targetCurrency?: string
}

export default async function runImputationJob(job: Job<ImputationJobData>): Promise<void> {
  const { periodMonth, exchangeRates, targetCurrency } = job.data
  console.log(`[imputation-worker] Starting calculation for period ${periodMonth}`)

  const result = await runImputationForPeriod({
    periodMonth,
    ...(exchangeRates ? { exchangeRates } : {}),
    ...(targetCurrency ? { targetCurrency } : {}),
  })

  console.log(
    `[imputation-worker] Completed period ${result.periodMonth}: ` +
      `${result.recordsInserted} records, hash=${result.auditHash.slice(0, 8)}...`,
  )
}
