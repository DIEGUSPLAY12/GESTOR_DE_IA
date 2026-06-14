import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyConsultantCosts } from '../api/hooks.js'
import type { ConsultantCostView } from '../types.js'

function currentPeriodMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Group entries by project
function groupByProject(costs: ConsultantCostView[]): Map<string, ConsultantCostView[]> {
  const map = new Map<string, ConsultantCostView[]>()
  for (const c of costs) {
    const key = c.project_id ?? '__none__'
    const list = map.get(key) ?? []
    list.push(c)
    map.set(key, list)
  }
  return map
}

export function ConsultantDashboard() {
  const navigate = useNavigate()
  const [periodMonth, setPeriodMonth] = useState(currentPeriodMonth())
  const { data: costs, isLoading, error } = useMyConsultantCosts(periodMonth)

  const totalCost = (costs ?? []).reduce((sum, c) => sum + Number(c.calculated_cost), 0)
  const hasCosts = (costs ?? []).length > 0
  const grouped = groupByProject(costs ?? [])

  return (
    <section aria-labelledby="consultant-dashboard-heading">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 id="consultant-dashboard-heading" className="text-xl font-semibold">
          Mi consumo de IA
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="consultant-period" className="text-sm text-gray-600">
            Periodo:
          </label>
          <input
            id="consultant-period"
            type="month"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" className="py-12 text-center text-gray-500">
          Cargando datos de consumo…
        </div>
      )}

      {error && (
        <div role="alert" className="py-8 text-center text-red-600">
          Error al cargar consumo: {error.message}
        </div>
      )}

      {!isLoading && !error && !hasCosts && (
        <div className="py-12 text-center">
          <p className="text-gray-500 text-sm">
            No tienes uso de IA registrado en {periodMonth}.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Ve a <strong>Mi área → Proyectos</strong> para registrar horas de uso en tus proyectos.
          </p>
        </div>
      )}

      {!isLoading && !error && hasCosts && (
        <>
          {/* Summary card */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg inline-flex gap-6">
            <div>
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                Coste total
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {totalCost.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                €
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                Registros
              </p>
              <p className="text-2xl font-bold text-blue-900">{(costs ?? []).length}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                Proyectos
              </p>
              <p className="text-2xl font-bold text-blue-900">{grouped.size}</p>
            </div>
          </div>

          {/* Grouped by project */}
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([projectKey, entries]) => {
              const first = entries[0]!
              const projectTotal = entries.reduce((s, e) => s + Number(e.calculated_cost), 0)
              const isClickable = projectKey !== '__none__' && first.project_id

              return (
                <div key={projectKey} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  {/* Project header */}
                  <div
                    className={`flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 ${isClickable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={() => { if (isClickable) navigate(`/projects/${first.project_id}`) }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">{first.project_code}</span>
                      <span className="text-sm font-semibold text-gray-800">{first.project_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">
                        €{projectTotal.toFixed(2)}
                      </span>
                      {isClickable && (
                        <span className="text-xs text-blue-600 hover:underline">Ver proyecto →</span>
                      )}
                    </div>
                  </div>

                  {/* Usage rows */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Herramienta</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Plan</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Período</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Uso</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Coste</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {entries.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{c.provider_name}</td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs">{c.plan_name}</td>
                          <td className="px-4 py-2.5 text-gray-500">{c.period_month}</td>
                          <td className="px-4 py-2.5 text-right text-gray-700">
                            {c.units_used} {c.unit_label}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                            {Number(c.calculated_cost).toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            {c.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
