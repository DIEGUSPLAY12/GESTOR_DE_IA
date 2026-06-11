import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface JobResult {
  jobId: string | number
  periodMonth: string
  status: string
}

const AUTO_REFRESH_SECONDS = 10

export function ImputationPanel() {
  const qc = useQueryClient()
  const [periodMonth, setPeriodMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [job, setJob] = useState<JobResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    return clearTimer
  }, [])

  function startCountdown() {
    setCountdown(AUTO_REFRESH_SECONDS)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearTimer()
          qc.invalidateQueries({ queryKey: ['budgets'] })
          setCountdown(null)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setJob(null)
    clearTimer()
    setCountdown(null)
    setLoading(true)

    try {
      const token = sessionStorage.getItem('access_token')
      const res = await fetch('/api/v1/imputations/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ period_month: periodMonth }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Error ${res.status}`)
      }

      const result = (await res.json()) as JobResult
      setJob(result)
      startCountdown()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al lanzar el cálculo')
    } finally {
      setLoading(false)
    }
  }

  function handleRefreshNow() {
    clearTimer()
    setCountdown(null)
    qc.invalidateQueries({ queryKey: ['budgets'] })
  }

  return (
    <section aria-labelledby="imputation-heading">
      <h2 id="imputation-heading" className="text-xl font-semibold mb-2">
        Calcular imputaciones
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Ejecuta el motor de imputación para el período seleccionado. El trabajo se encola en segundo plano y los resultados se reflejan en el dashboard de presupuestos.
      </p>

      <form onSubmit={handleCalculate} className="flex items-end gap-4 mb-6 flex-wrap">
        <div>
          <label htmlFor="period-month" className="block text-sm font-medium text-gray-700 mb-1">
            Período (YYYY-MM)
          </label>
          <input
            id="period-month"
            type="month"
            required
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {loading ? 'Lanzando…' : 'Calcular imputaciones'}
        </button>
      </form>

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {job && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-green-50 border border-green-200 rounded space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
              {job.status === 'queued' ? 'Encolado' : job.status}
            </span>
            <span className="text-sm text-gray-700 font-medium">
              Período: <strong>{job.periodMonth}</strong>
            </span>
            <span className="text-xs text-gray-400 font-mono">
              job#{String(job.jobId).slice(0, 12)}
            </span>
          </div>

          <p className="text-sm text-gray-600">
            El cálculo se ejecuta en segundo plano. Los presupuestos se actualizarán automáticamente.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleRefreshNow}
              className="px-3 py-1 text-xs font-medium text-green-700 border border-green-400 rounded hover:bg-green-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-500"
            >
              Refrescar presupuestos ahora
            </button>
            {countdown !== null && (
              <span className="text-xs text-gray-400">
                Actualizando automáticamente en {countdown}s…
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
