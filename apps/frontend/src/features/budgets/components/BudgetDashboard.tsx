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
  LineChart,
  Line,
} from 'recharts'
import { useBudgets } from '../api/hooks.js'
import { useProjects, useProjectAiAccounts } from '../../master-data/api/hooks.js'
import { DeviationsAlert } from './DeviationsAlert.js'
import type { BudgetSummary } from '../types.js'
import type { ProjectAiAccount } from '../../master-data/types.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentPeriodMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function accountStatus(validTo: string | null): { label: string; cls: string } {
  if (!validTo) return { label: 'Activa', cls: 'bg-green-100 text-green-700' }
  const today = new Date().toISOString().slice(0, 10)
  return validTo >= today
    ? { label: 'Activa', cls: 'bg-green-100 text-green-700' }
    : { label: 'Vencida', cls: 'bg-gray-100 text-gray-500' }
}

// ─── Budget chart types ───────────────────────────────────────────────────────

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
    <div className="bg-white border border-alten-border rounded shadow p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}:{' '}
          {entry.value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </p>
      ))}
      {pct != null && <p className="text-alten-mid mt-1">{pct.toFixed(1)}% consumido</p>}
    </div>
  )
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCards({ summaries }: { summaries: BudgetSummary[] }) {
  const totalBudget = summaries.reduce(
    (acc, s) => acc + (s.monthly_budget != null ? Number(s.monthly_budget) : 0),
    0,
  )
  const totalSpent = summaries.reduce((acc, s) => acc + Number(s.actual_cost), 0)
  const totalRemaining = totalBudget - totalSpent
  const remainingPositive = totalRemaining >= 0

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="rounded-lg border border-alten-border bg-white px-4 py-3">
        <p className="text-xs text-alten-mid uppercase tracking-wide">Presupuesto total</p>
        <p className="mt-1 text-xl font-bold text-alten-body tabular-nums">{fmt(totalBudget)} €</p>
      </div>
      <div className="rounded-lg border border-alten-border bg-white px-4 py-3">
        <p className="text-xs text-alten-mid uppercase tracking-wide">Gasto acumulado</p>
        <p className="mt-1 text-xl font-bold text-alten-body tabular-nums">{fmt(totalSpent)} €</p>
      </div>
      <div className={`rounded-lg border px-4 py-3 ${remainingPositive ? 'border-alten-mid-blue bg-alten-pale' : 'border-alten-red/30 bg-red-50'}`}>
        <p className="text-xs text-alten-mid uppercase tracking-wide">Restante</p>
        <p className={`mt-1 text-xl font-bold tabular-nums ${remainingPositive ? 'text-alten-dark' : 'text-alten-red'}`}>
          {fmt(totalRemaining)} €
        </p>
      </div>
    </div>
  )
}

// ─── AI accounts for a selected project ──────────────────────────────────────

function buildByProviderData(accounts: ProjectAiAccount[]) {
  const map = new Map<string, number>()
  for (const acc of accounts) {
    map.set(acc.provider_name, (map.get(acc.provider_name) ?? 0) + acc.total_cost)
  }
  return Array.from(map.entries()).map(([name, cost]) => ({ name, Coste: cost }))
}

function buildTimelineData(accounts: ProjectAiAccount[]) {
  const map = new Map<string, number>()
  for (const acc of accounts) {
    for (const p of acc.by_period) {
      map.set(p.period_month, (map.get(p.period_month) ?? 0) + p.cost)
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, cost]) => ({ period, Coste: cost }))
}

interface CostTooltipProps {
  active?: boolean
  payload?: { value: number; color: string; name: string }[]
  label?: string
}

function CostTooltip({ active, payload, label }: CostTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-alten-border rounded shadow p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((e) => (
        <p key={e.name} style={{ color: e.color }}>
          {e.name}: {fmt(e.value)} €
        </p>
      ))}
    </div>
  )
}

function ProjectAiSection({ projectId }: { projectId: string }) {
  const { data: accounts, isLoading, error } = useProjectAiAccounts(projectId)

  if (isLoading) {
    return <p className="text-sm text-alten-mid py-4 text-center">Cargando cuentas de IA…</p>
  }
  if (error) {
    return <p className="text-sm text-alten-red py-4">Error al cargar cuentas: {error.message}</p>
  }
  if (!accounts || accounts.length === 0) {
    return <p className="text-sm text-alten-mid py-4">Este proyecto no tiene cuentas de IA con actividad registrada.</p>
  }

  const totalCost = accounts.reduce((s, a) => s + a.total_cost, 0)
  const byProvider = buildByProviderData(accounts)
  const timeline = buildTimelineData(accounts)
  const hasTimeline = timeline.length > 1

  return (
    <div className="space-y-5">
      {/* Accounts table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-alten-light">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-alten-mid">Cuenta</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-alten-mid">Proveedor</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-alten-mid">Plan</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-alten-mid">Tipo</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-alten-mid">Activación</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-alten-mid">Estado</th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-alten-mid">Coste total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {accounts.map((acc) => {
              const st = accountStatus(acc.valid_to)
              return (
                <tr key={acc.account_id}>
                  <td className="px-3 py-2 font-mono text-xs">{acc.identifier}</td>
                  <td className="px-3 py-2 text-alten-body">{acc.provider_name}</td>
                  <td className="px-3 py-2 text-alten-body">{acc.plan_name}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-alten-pale text-alten-blue font-medium">
                      {acc.plan_type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-alten-mid text-xs">{acc.valid_from}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-alten-body">
                    {fmt(acc.total_cost)} {acc.currency}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t-2 border-alten-border">
            <tr>
              <td colSpan={6} className="px-3 py-2 text-xs font-semibold text-alten-mid">Total acumulado</td>
              <td className="px-3 py-2 text-right font-bold text-alten-body">{fmt(totalCost)} €</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Charts row */}
      <div className={`grid gap-4 ${hasTimeline ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-md'}`}>
        {/* Cost by provider */}
        <div>
          <p className="text-xs font-semibold text-alten-mid uppercase tracking-wide mb-2">Coste por proveedor</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byProvider} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(0)}€`} />
              <Tooltip content={<CostTooltip />} />
              <Bar dataKey="Coste" fill="#008BD2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time evolution */}
        {hasTimeline && (
          <div>
            <p className="text-xs font-semibold text-alten-mid uppercase tracking-wide mb-2">Evolución temporal</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={timeline} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(0)}€`} />
                <Tooltip content={<CostTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="Coste" stroke="#008BD2" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function BudgetDashboard() {
  const [periodMonth, setPeriodMonth] = useState(currentPeriodMonth())
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const { data: summaries, isLoading, error } = useBudgets(periodMonth)
  const { data: allProjects } = useProjects()

  const chartData = toChartData(summaries ?? [])
  const hasData = chartData.length > 0
  const hasBudgets = (summaries ?? []).some((s) => s.monthly_budget != null)
  const activeProjects = (allProjects ?? []).filter((p) => p.deleted_at === null)

  return (
    <section aria-labelledby="budget-dashboard-heading">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 id="budget-dashboard-heading" className="text-xl font-semibold">
          Presupuestos
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="period-select" className="text-sm text-alten-body">
            Periodo:
          </label>
          <input
            id="period-select"
            type="month"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="border border-alten-border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-alten-blue focus:outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" className="py-12 text-center text-alten-mid">
          Cargando presupuestos…
        </div>
      )}

      {error && (
        <div role="alert" className="py-8 text-center text-alten-red">
          Error al cargar presupuestos: {error.message}
        </div>
      )}

      {!isLoading && !error && !hasData && (
        <p className="text-alten-mid text-sm py-8 text-center">
          No hay datos de presupuesto para {periodMonth}.
        </p>
      )}

      {!isLoading && !error && hasData && (
        <>
          <SummaryCards summaries={summaries!} />

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

              <details className="mt-2">
                <summary className="text-xs text-alten-mid cursor-pointer hover:text-alten-body">
                  Ver datos en tabla
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full text-sm divide-y divide-gray-200">
                    <caption className="sr-only">
                      Presupuesto vs coste real por proyecto — {periodMonth}
                    </caption>
                    <thead className="bg-alten-light">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-alten-mid">Proyecto</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-alten-mid">Presupuesto</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-alten-mid">Coste real</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-alten-mid">% consumido</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-alten-mid">Restante</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {summaries!.map((s) => {
                        const budget = s.monthly_budget != null ? Number(s.monthly_budget) : null
                        const spent = Number(s.actual_cost)
                        const remaining = budget != null ? budget - spent : null
                        const remainingPos = remaining == null || remaining >= 0
                        return (
                          <tr key={s.project_id}>
                            <td className="px-3 py-2 font-mono text-xs">{s.project_code}</td>
                            <td className="px-3 py-2 text-right text-alten-body">
                              {budget != null ? `${fmt(budget)} €` : '—'}
                            </td>
                            <td className="px-3 py-2 text-right text-alten-body">{fmt(spent)} €</td>
                            <td className="px-3 py-2 text-right text-alten-body">
                              {s.percentage_used != null ? `${s.percentage_used.toFixed(1)}%` : '—'}
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${remainingPos ? 'text-alten-dark' : 'text-alten-red'}`}>
                              {remaining != null ? `${fmt(remaining)} €` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          ) : (
            <p className="text-sm text-alten-mid mb-6 italic">
              Ningún proyecto tiene presupuesto configurado para este periodo.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaries!.map((summary) => (
              <DeviationsAlert key={summary.project_id} summary={summary} />
            ))}
          </div>
        </>
      )}

      {/* ── AI accounts detail ─────────────────────────────────────────── */}
      {activeProjects.length > 0 && (
        <div className="mt-10 border-t border-alten-border pt-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-lg font-semibold text-alten-body">Cuentas de IA por proyecto</h3>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="border border-alten-border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-alten-blue focus:outline-none min-w-[220px]"
              aria-label="Seleccionar proyecto"
            >
              <option value="">— Selecciona un proyecto —</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {selectedProjectId ? (
            <ProjectAiSection key={selectedProjectId} projectId={selectedProjectId} />
          ) : (
            <p className="text-sm text-alten-mid py-4">
              Selecciona un proyecto para ver sus cuentas de IA y gráficas de coste.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
