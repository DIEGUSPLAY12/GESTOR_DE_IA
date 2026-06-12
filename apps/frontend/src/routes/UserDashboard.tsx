import { useState } from 'react'
import { UsageForm } from '../features/usage/components/UsageForm.js'
import { UsageHistory } from '../features/usage/components/UsageHistory.js'
import { JoinProjectSection } from '../features/master-data/components/JoinProjectSection.js'
import { useMyUsage } from '../features/usage/api/hooks.js'
import { useCurrentUser } from '../lib/useCurrentUser.js'

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function UserDashboard() {
  const { person } = useCurrentUser()
  const today = new Date().toISOString().slice(0, 7)
  const [periodMonth, setPeriodMonth] = useState(today)

  const { data: entries } = useMyUsage(periodMonth)

  const totalUnits = (entries ?? []).reduce((sum, r) => sum + Number(r.units_used), 0)
  const totalCost = (entries ?? []).reduce((sum, r) => sum + Number(r.calculated_cost), 0)
  const currency = entries?.[0]?.currency ?? 'EUR'

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Mi área{person ? ` — ${person.full_name}` : ''}
          </h1>
          <p className="text-sm text-gray-500">Registra y consulta tu uso de IA</p>
        </div>
        <div className="ml-auto">
          <label htmlFor="dashboard-period" className="sr-only">
            Período
          </label>
          <input
            id="dashboard-period"
            type="month"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <SummaryCard
          label="Unidades registradas"
          value={totalUnits.toFixed(2)}
          sub={entries?.[0]?.unit_label ?? 'hours'}
        />
        <SummaryCard
          label="Coste acumulado"
          value={`${totalCost.toFixed(4)} ${currency}`}
          sub={periodMonth}
        />
      </div>

      {/* Main layout: form left, history right */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UsageForm periodMonth={periodMonth} />
        <UsageHistory periodMonth={periodMonth} />
      </div>

      {/* Projects section */}
      {person && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis proyectos</h2>
          <JoinProjectSection personId={person.id} />
        </div>
      )}
    </div>
  )
}
