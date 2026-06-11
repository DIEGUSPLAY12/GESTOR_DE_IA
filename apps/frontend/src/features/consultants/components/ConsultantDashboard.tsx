import { useState } from 'react'
import { useMyConsultantCosts } from '../api/hooks.js'

function currentPeriodMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function ConsultantDashboard() {
  const [periodMonth, setPeriodMonth] = useState(currentPeriodMonth())
  const { data: costs, isLoading, error } = useMyConsultantCosts(periodMonth)

  const totalCost = (costs ?? []).reduce((sum, c) => sum + Number(c.allocated_cost), 0)
  const hasCosts = (costs ?? []).length > 0

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
            No tienes cuentas de IA imputadas en {periodMonth}.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Contacta con el administrador si crees que es un error.
          </p>
        </div>
      )}

      {!isLoading && !error && hasCosts && (
        <>
          {/* Summary card */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg inline-flex gap-6">
            <div>
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                Coste total imputado
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
                Cuentas activas
              </p>
              <p className="text-2xl font-bold text-blue-900">{costs!.length}</p>
            </div>
          </div>

          {/* Read-only table — no action buttons per FR-021 */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table role="table" className="min-w-full divide-y divide-gray-200 text-sm">
              <caption className="sr-only">
                Cuentas de IA y costes imputados — {periodMonth}
              </caption>
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Cuenta
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Proveedor
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    % Titularidad
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    Coste imputado
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Detalle de cálculo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {costs!.map((c, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">
                      {c.account_name}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.provider_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {Number(c.ownership_pct).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {Number(c.allocated_cost).toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {c.currency}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-xs truncate">
                      {c.calculation_trace}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={3} className="px-4 py-3 text-sm text-gray-700">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {totalCost.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    €
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
