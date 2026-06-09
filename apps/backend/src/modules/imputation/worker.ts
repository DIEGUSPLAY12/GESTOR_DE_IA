import type { Job } from 'bullmq'

export interface ImputationJobData {
  periodMonth: string // 'YYYY-MM'
  requestedBy: string // person sub from JWT
}

export default async function runImputationJob(job: Job<ImputationJobData>): Promise<void> {
  const { periodMonth } = job.data
  console.log(`[imputation-worker] Starting calculation for period ${periodMonth}`)
  // Full implementation in T019 (service.ts)
  throw new Error(`ImputationService not yet implemented for period ${periodMonth}`)
}
