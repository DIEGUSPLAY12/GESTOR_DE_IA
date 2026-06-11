import { Queue, Worker, type Processor } from 'bullmq'

export const QUEUE_NAMES = {
  IMPUTATION: 'imputation',
} as const

// Redis is optional — only connect if REDIS_HOST is explicitly configured
const REDIS_HOST = process.env['REDIS_HOST']

function connectionOpts() {
  if (!REDIS_HOST) throw new Error('Redis not configured (REDIS_HOST not set)')
  return {
    host: REDIS_HOST,
    port: Number(process.env['REDIS_PORT'] ?? 6379),
    ...(process.env['REDIS_PASSWORD'] ? { password: process.env['REDIS_PASSWORD'] } : {}),
    maxRetriesPerRequest: null as null,
  }
}

export function isQueueAvailable(): boolean {
  return Boolean(REDIS_HOST)
}

export function createQueue<T = unknown>(name: string): Queue<T> {
  return new Queue<T>(name, { connection: connectionOpts() }) as unknown as Queue<T>
}

export function createWorker<T = unknown>(
  name: string,
  processor: Processor<T>,
): Worker<T> {
  return new Worker<T>(name, processor, { connection: connectionOpts(), concurrency: 2 }) as unknown as Worker<T>
}
