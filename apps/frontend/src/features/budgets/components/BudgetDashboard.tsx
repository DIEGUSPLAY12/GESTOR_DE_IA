import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useBudgets } from '../api/hooks.js'
import { DeviationsAlert } from './DeviationsAlert.js'
import type { BudgetSummary } from '../types.js'

function currentPeriodMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

interface ChartDataPoint {
  name: string
  Presupuesto: number
  'Coste real': number
  pct: number | null
}

function toChartData(summaries: BudgetSummary[]): ChartDataPoint[] {
  return summaries.map((s) => ({
    name: s.project_code,
    Presupuesto: s.monthly_budget != null ? Number(s.monthly_budget) : 0,
    'Coste real': Number(s.actual_cost),
    pct: s.percentage_used,
  }))
}

interface TooltipEntry {
  name: string
  value: number
  color: string
  payload: ChartDataPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const pct = payload[0]?.payload.pct ?? null
  return (
    <div className="bg-white border border-gray-200 rounded shadow p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}:{' '}
          {entry.value.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          €
        </p>
      ))}
      {pct != null && <p className="text-gray-500 mt-1">{pct.toFixed(1)}% consumido</p>}
    </div>
  )
}

export function BudgetDashboard() {
  const [periodMonth, setPeriodMonth] = useState(currentPeriodMonth())
  const { data: summaries, isLoading, error } = useBudgets(periodMonth)

  const chartData = toChartData(summaries ?? [])
  const hasData = chartData.length > 0
  const hasBudgets = (summaries ?? []).some((s) => s.monthly_budget != null)

  return (
    <section aria-labelledby="budget-dashboard-heading">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 id="budget-dashboard-heading" className="text-xl font-semibold">
          Presupuestos
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="period-select" className="text-sm text-gray-600">
            Periodo:
          </label>
          <input
            id="period-select"
            type="month"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" className="py-12 text-center text-gray-500">
          Cargando presupuestos…
        </div>
      )}

      {error && (
        <div role="alert" className="py-8 text-center text-red-600">
          Error al cargar presupuestos: {error.message}
        </div>
      )}

      {!isLoading && !error && !hasData && (
        <p className="text-gray-500 text-sm py-8 text-center">
          No hay datos de presupuesto para {periodMonth}.
        </p>
      )}

      {!isLoading && !error && hasData && (
        <>
          {/* Recharts bar chart */}
          {hasBudgets ? (
            <div className="mb-8">
              <div
                aria-label={`Gráfico comparativo presupuesto vs coste real para ${periodMonth}`}
                role="img"
                className="w-full"
              >
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(v: number) =>
                        v.toLocaleString('es-ES', { maximumFractionDigits: 0 })
                      }
                      tick={{ fontSize: 12 }}
                      unit=" €"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Presupuesto" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Coste real" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Accessible table alternative */}
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                  Ver datos en tabla
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full text-sm divide-y divide-gray-200">
                    <caption className="sr-only">
                      Presupuesto vs coste real por proyecto — {periodMonth}
                    </caption>
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Proyecto
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                          Presupuesto
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                          Coste real
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                          % consumido
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {summaries!.map((s) => (
                        <tr key={s.project_id}>
                          <td className="px-3 py-2 font-mono text-xs">{s.project_code}</td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {s.monthly_budget != null
                              ? `${Number(s.monthly_budget).toLocaleString('es-ES', {
                                  minimumFractionDigits: 2,
                                })} €`
                              : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {Number(s.actual_cost).toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            €
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {s.percentage_used != null ? `${s.percentage_used.toFixed(1)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-6 italic">
              Ningún proyecto tiene presupuesto configurado para este periodo.
            </p>
          )}

          {/* Deviation cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaries!.map((summary) => (
              <DeviationsAlert key={summary.project_id} summary={summary} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
