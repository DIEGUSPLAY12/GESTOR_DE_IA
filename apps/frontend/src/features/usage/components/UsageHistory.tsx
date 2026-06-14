import { useMyUsage } from '../api/hooks.js'

interface Props {
  periodMonth: string
}

export function UsageHistory({ periodMonth }: Props) {
  const { data: entries, isLoading, error } = useMyUsage(periodMonth)

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="py-6 text-center text-sm text-alten-mid">
        Cargando historial…
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="py-4 text-sm text-alten-red">
        Error al cargar historial: {error.message}
      </div>
    )
  }

  const rows = entries ?? []

  const totalUnits = rows.reduce((sum, r) => sum + Number(r.units_used), 0)
  const totalCost = rows.reduce((sum, r) => sum + Number(r.calculated_cost), 0)
  const currency = rows[0]?.currency ?? 'EUR'

  return (
    <div className="rounded-lg border border-alten-border bg-white">
      <div className="px-4 py-3 border-b border-alten-light">
        <h2 className="text-base font-semibold text-alten-body">
          Historial de uso — {periodMonth}
        </h2>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-alten-mid text-center">
          No hay registros para este período.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-alten-light bg-alten-light">
                <th scope="col" className="px-4 py-2 text-left font-medium text-alten-body">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-2 text-left font-medium text-alten-body">
                  Proyecto
                </th>
                <th scope="col" className="px-4 py-2 text-left font-medium text-alten-body">
                  Cuenta / Plan
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium text-alten-body">
                  Unidades
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium text-alten-body">
                  Coste
                </th>
                <th scope="col" className="px-4 py-2 text-center font-medium text-alten-body">
                  Moneda
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-alten-light">
                  <td className="px-4 py-2 text-alten-body whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-2 text-alten-body">
                    {r.project ? `${r.project.code} · ${r.project.name}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-alten-body">
                    {r.account ? (
                      <>
                        <span className="font-medium">{r.account.external_identifier}</span>
                        {r.account.pricing_plan && (
                          <span className="ml-1 text-alten-mid">
                            ({r.account.pricing_plan.name})
                          </span>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-alten-body">
                    {Number(r.units_used).toFixed(2)}{' '}
                    <span className="text-alten-mid">{r.unit_label}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-alten-body font-medium">
                    {Number(r.calculated_cost).toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-center text-alten-mid">{r.currency}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-alten-border bg-alten-light font-semibold">
                <td className="px-4 py-2 text-alten-body" colSpan={3}>
                  Total
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-alten-body">
                  {totalUnits.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-alten-body">
                  {totalCost.toFixed(4)}
                </td>
                <td className="px-4 py-2 text-center text-alten-mid">{currency}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
