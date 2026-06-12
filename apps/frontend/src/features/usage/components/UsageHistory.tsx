import { useMyUsage } from '../api/hooks.js'

interface Props {
  periodMonth: string
}

export function UsageHistory({ periodMonth }: Props) {
  const { data: entries, isLoading, error } = useMyUsage(periodMonth)

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="py-6 text-center text-sm text-gray-500">
        Cargando historial…
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="py-4 text-sm text-red-600">
        Error al cargar historial: {error.message}
      </div>
    )
  }

  const rows = entries ?? []

  const totalUnits = rows.reduce((sum, r) => sum + Number(r.units_used), 0)
  const totalCost = rows.reduce((sum, r) => sum + Number(r.calculated_cost), 0)
  const currency = rows[0]?.currency ?? 'EUR'

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">
          Historial de uso — {periodMonth}
        </h2>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-500 text-center">
          No hay registros para este período.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th scope="col" className="px-4 py-2 text-left font-medium text-gray-600">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-2 text-left font-medium text-gray-600">
                  Proyecto
                </th>
                <th scope="col" className="px-4 py-2 text-left font-medium text-gray-600">
                  Cuenta / Plan
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium text-gray-600">
                  Unidades
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium text-gray-600">
                  Coste
                </th>
                <th scope="col" className="px-4 py-2 text-center font-medium text-gray-600">
                  Moneda
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {r.project ? `${r.project.code} · ${r.project.name}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {r.account ? (
                      <>
                        <span className="font-medium">{r.account.external_identifier}</span>
                        {r.account.pricing_plan && (
                          <span className="ml-1 text-gray-400">
                            ({r.account.pricing_plan.name})
                          </span>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                    {Number(r.units_used).toFixed(2)}{' '}
                    <span className="text-gray-400">{r.unit_label}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-800 font-medium">
                    {Number(r.calculated_cost).toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-center text-gray-500">{r.currency}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="px-4 py-2 text-gray-700" colSpan={3}>
                  Total
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-800">
                  {totalUnits.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-900">
                  {totalCost.toFixed(4)}
                </td>
                <td className="px-4 py-2 text-center text-gray-500">{currency}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
