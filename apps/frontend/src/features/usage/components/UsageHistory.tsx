import { useMyUsage } from '../api/hooks.js'

interface Props {
  periodMonth: string
}

const MONTHS_ES = ['ene.','feb.','mar.','abr.','may.','jun.','jul.','ago.','sep.','oct.','nov.','dic.']

function formatDateEU(iso: string): string {
  const parts = iso.split('-')
  const y = parts[0] ?? ''
  const m = parseInt(parts[1] ?? '1', 10)
  const d = parseInt(parts[2] ?? '1', 10)
  return `${d} ${MONTHS_ES[m - 1] ?? ''} ${y}`
}

function formatPeriod(yyyymm: string): string {
  const [y, m] = yyyymm.split('-')
  const idx = parseInt(m ?? '1', 10) - 1
  const monthName = MONTHS_ES[idx]?.replace('.', '') ?? ''
  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${y ?? ''}`
}

function formatUnits(value: number, label: string): string {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '')
  return `${rounded} ${label}`
}

function formatCost(value: number): string {
  return value.toFixed(2)
}

function formatProjectName(raw: string): string {
  return raw.replace(/_/g, ' ')
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

  const totalCost = rows.reduce((sum, r) => sum + Number(r.calculated_cost), 0)
  const currency = rows[0]?.currency ?? 'EUR'

  return (
    <div className="rounded-lg border border-alten-border bg-white overflow-hidden">
      {/* Cabecera */}
      <div className="px-5 py-4 border-b border-alten-border flex items-center justify-between">
        <div>
          <h2 className="type-card-title">Historial de uso</h2>
          <p style={{ fontSize: 13, color: '#8C8C9A', marginTop: 2 }}>{formatPeriod(periodMonth)}</p>
        </div>
        {rows.length > 0 && (
          <div className="text-right">
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#8C8C9A' }}>
              Coste total
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#043962', lineHeight: 1.3 }}>
              {formatCost(totalCost)}{' '}
              <span style={{ fontSize: 13, fontWeight: 500, color: '#8C8C9A' }}>{currency}</span>
            </p>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-8 text-sm text-alten-mid text-center">
          No hay registros para este período.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className="th">Fecha</th>
                <th scope="col" className="th">Proyecto</th>
                <th scope="col" className="th">Cuenta / Plan</th>
                <th scope="col" className="th" style={{ textAlign: 'right' }}>Unidades</th>
                <th scope="col" className="th" style={{ textAlign: 'right' }}>
                  Coste ({currency})
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  style={{ background: i % 2 === 0 ? '#ffffff' : '#FAFAFA', borderBottom: '1px solid #F0F0F2' }}
                >
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#484848' }}>
                    {formatDateEU(r.created_at.slice(0, 10))}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#484848' }}>
                    {r.project ? (
                      <span>
                        <span className="badge-code" style={{ marginRight: 6 }}>{r.project.code}</span>
                        {formatProjectName(r.project.name)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#484848' }}>
                    {r.account ? (
                      <>
                        <span style={{ fontWeight: 500 }}>{r.account.external_identifier}</span>
                        {r.account.pricing_plan && (
                          <span style={{ marginLeft: 6, color: '#8C8C9A' }}>
                            {r.account.pricing_plan.name}
                          </span>
                        )}
                      </>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 tabular-nums" style={{ textAlign: 'right', color: '#484848' }}>
                    {formatUnits(Number(r.units_used), r.unit_label)}
                  </td>
                  <td className="px-4 py-3 tabular-nums" style={{ textAlign: 'right', fontWeight: 600, color: '#043962' }}>
                    {formatCost(Number(r.calculated_cost))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #E6E6E9', background: '#F4F6F9' }}>
                <td className="px-4 py-3" colSpan={4} style={{ fontWeight: 700, color: '#043962' }}>
                  Total
                </td>
                <td className="px-4 py-3 tabular-nums" style={{ textAlign: 'right', fontWeight: 700, color: '#043962' }}>
                  {formatCost(totalCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
