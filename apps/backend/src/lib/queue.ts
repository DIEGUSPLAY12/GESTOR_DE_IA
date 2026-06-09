import { Queue, Worker, type Processor } from 'bullmq'
import { Redis } from 'ioredis'

const connection = new Redis({
  host: process.env['REDIS_HOST'] ?? 'localhost',
  port: Number(process.env['REDIS_PORT'] ?? 6379),
  password: process.env['REDIS_PASSWORD'] || undefined,
  maxRetriesPerRequest: null, // required by BullMQ
})

export const QUEUE_NAMES = {
  IMPUTATION: 'imputation',
} as const

export function createQueue<T = unknown>(name: string): Queue<T> {
  return new Queue<T>(name, { connection })
}

export function createWorker<T = unknown>(
  name: string,
  processor: Processor<T>,
): Worker<T> {
  return new Worker<T>(name, processor, { connection, concurrency: 2 })
}

export { connection as redisConnection }
