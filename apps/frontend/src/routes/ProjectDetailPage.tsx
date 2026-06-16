import { useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../lib/useCurrentUser.js'
import {
  useProjects,
  useMyProjectAssignment,
  useLeaveProject,
  useProjectUsage,
  useAddProjectUsage,
  useUpdateProjectUsage,
  useDeleteProjectUsage,
  useMyAccounts,
  useProjectAiAccounts,
} from '../features/master-data/api/hooks.js'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts'
import type { ProjectUsageEntry, ProjectAiAccount } from '../features/master-data/types.js'

// ─── Shared helpers ───────────────────────────────────────────────────────────

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
        <p key={e.name} style={{ color: e.color }}>{e.name}: {fmt(e.value)} €</p>
      ))}
    </div>
  )
}

// ─── AI accounts chart section (used by both admin and user views) ────────────

function ProjectAiSection({ accounts }: { accounts: ProjectAiAccount[] }) {
  if (accounts.length === 0) {
    return <p className="text-sm text-alten-mid py-4">No hay cuentas de IA con actividad registrada en este proyecto.</p>
  }

  const totalCost = accounts.reduce((s, a) => s + a.total_cost, 0)

  const byProvider = (() => {
    const map = new Map<string, number>()
    for (const acc of accounts) map.set(acc.provider_name, (map.get(acc.provider_name) ?? 0) + acc.total_cost)
    return Array.from(map.entries()).map(([name, cost]) => ({ name, Coste: cost }))
  })()

  const timeline = (() => {
    const map = new Map<string, number>()
    for (const acc of accounts) {
      for (const p of acc.by_period) map.set(p.period_month, (map.get(p.period_month) ?? 0) + p.cost)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, cost]) => ({ period, Coste: cost }))
  })()

  const hasTimeline = timeline.length > 1

  return (
    <div className="space-y-4">
      {/* Accounts table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-alten-light">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-alten-mid">Cuenta</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-alten-mid">Proveedor</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-alten-mid">Plan</th>
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
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{fmt(acc.total_cost)} {acc.currency}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t-2 border-alten-border">
            <tr>
              <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-alten-mid">Total acumulado</td>
              <td className="px-3 py-2 text-right font-bold text-alten-body">{fmt(totalCost)} €</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Charts */}
      <div className={`grid gap-4 ${hasTimeline ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-sm'}`}>
        <div>
          <p className="text-xs font-semibold text-alten-mid uppercase tracking-wide mb-2">Coste por proveedor</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byProvider} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(0)}€`} />
              <Tooltip content={<CostTooltip />} />
              <Bar dataKey="Coste" fill="#008BD2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {hasTimeline && (
          <div>
            <p className="text-xs font-semibold text-alten-mid uppercase tracking-wide mb-2">Evolución temporal</p>
            <ResponsiveContainer width="100%" height={160}>
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

// ─── Admin: add usage form ────────────────────────────────────────────────────

interface AddUsageFormProps { projectId: string; onClose: () => void }

function AddUsageForm({ projectId, onClose }: AddUsageFormProps) {
  const { data: mySubscriptions } = useMyAccounts()
  const addUsage = useAddProjectUsage()
  const today = new Date().toISOString().slice(0, 7)

  const [accountId, setAccountId] = useState('')
  const [hours, setHours] = useState('')
  const [periodMonth, setPeriodMonth] = useState(today)
  const [error, setError] = useState<string | null>(null)

  const perSeatTools = (mySubscriptions ?? []).filter(
    (t) => t.account?.pricing_plan?.type === 'PER_SEAT',
  )
  const selectedTool = perSeatTools.find((t) => t.account_id === accountId)
  const unitPrice = selectedTool?.account?.pricing_plan?.unit_price
    ? Number(selectedTool.account.pricing_plan.unit_price)
    : null
  const parsedHours = Number(hours)
  const previewCost =
    unitPrice !== null && parsedHours > 0
      ? (Math.round((parsedHours * unitPrice / 160) * 100) / 100).toFixed(2)
      : null
  const currency = selectedTool?.account?.pricing_plan?.currency ?? 'EUR'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!accountId || parsedHours <= 0) return
    try {
      await addUsage.mutateAsync({ projectId, account_id: accountId, hours: parsedHours, period_month: periodMonth })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar uso')
    }
  }

  if (perSeatTools.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">No hay herramientas PER_SEAT asignadas a tu perfil.</p>
        <button type="button" onClick={onClose} className="mt-2 text-xs text-alten-mid hover:text-alten-body">Cerrar</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-lg border border-alten-border bg-white p-4 space-y-4">
      <h4 className="text-sm font-semibold text-alten-body">Añadir uso de IA</h4>
      {error && <p role="alert" className="text-sm text-alten-red">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-alten-body mb-1">Herramienta *</label>
          <select required value={accountId} onChange={(e) => setAccountId(e.target.value)}
            className="block w-full rounded border border-alten-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-alten-blue">
            <option value="">— Selecciona —</option>
            {perSeatTools.map((t) => (
              <option key={t.account_id} value={t.account_id}>
                {t.account?.pricing_plan?.provider?.name
                  ? `${t.account.pricing_plan.provider.name} — ${t.account.pricing_plan.name}`
                  : (t.account?.pricing_plan?.name ?? t.account?.external_identifier ?? t.account_id)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-alten-body mb-1">Horas de uso *</label>
          <input type="number" required min="0.5" step="0.5" placeholder="ej. 40" value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="block w-full rounded border border-alten-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-alten-blue" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-alten-body mb-1">Período</label>
        <input type="month" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)}
          className="block w-full max-w-[200px] rounded border border-alten-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-alten-blue" />
      </div>
      {previewCost !== null && (
        <div className="rounded bg-alten-pale border border-alten-mid-blue px-3 py-2 text-sm text-alten-dark">
          Coste estimado: <strong>{previewCost} {currency}</strong>
          <span className="ml-2 text-xs text-alten-blue">({parsedHours}h × €{unitPrice?.toFixed(2)}/mes ÷ 160h)</span>
        </div>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={!accountId || parsedHours <= 0 || addUsage.isPending}
          className="rounded bg-alten-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-alten-hover disabled:opacity-50 disabled:cursor-not-allowed">
          {addUsage.isPending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onClose}
          className="rounded border border-alten-border px-3 py-1.5 text-xs text-alten-body hover:bg-alten-light">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Admin: usage row with edit/delete ────────────────────────────────────────

function UsageRow({ entry, projectId }: { entry: ProjectUsageEntry; projectId: string }) {
  const updateUsage = useUpdateProjectUsage()
  const deleteUsage = useDeleteProjectUsage()
  const [editing, setEditing] = useState(false)
  const [hours, setHours] = useState(String(entry.units_used))

  const providerName = entry.account?.pricing_plan?.provider?.name
  const planName = entry.account?.pricing_plan?.name ?? entry.account?.external_identifier ?? '—'
  const label = providerName ? `${providerName} — ${planName}` : planName

  async function handleSave() {
    const parsed = Number(hours)
    if (parsed <= 0) return
    await updateUsage.mutateAsync({ projectId, usageId: entry.id, hours: parsed })
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este registro de uso?')) return
    await deleteUsage.mutateAsync({ projectId, usageId: entry.id })
  }

  return (
    <tr className="border-t border-alten-light">
      <td className="py-2 pr-4 text-sm text-alten-body">{label}</td>
      <td className="py-2 pr-4 text-sm text-alten-body">{entry.period_month}</td>
      <td className="py-2 pr-4 text-sm text-alten-body">
        {editing ? (
          <div className="flex items-center gap-1">
            <input type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)}
              className="w-20 rounded border border-alten-border px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-alten-blue" />
            <button type="button" onClick={() => void handleSave()} disabled={updateUsage.isPending}
              className="rounded bg-alten-blue px-2 py-0.5 text-xs text-white hover:bg-alten-hover disabled:opacity-50">OK</button>
            <button type="button" onClick={() => { setEditing(false); setHours(String(entry.units_used)) }}
              className="rounded border border-alten-border px-2 py-0.5 text-xs text-alten-body hover:bg-alten-light">✕</button>
          </div>
        ) : (
          <span>{entry.units_used}h</span>
        )}
      </td>
      <td className="py-2 pr-4 text-sm font-medium text-alten-body">
        {Number(entry.calculated_cost).toFixed(2)} {entry.currency}
      </td>
      <td className="py-2 text-right">
        <div className="flex justify-end gap-2">
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-alten-blue hover:underline">Editar</button>
          )}
          <button type="button" onClick={() => void handleDelete()} disabled={deleteUsage.isPending}
            className="text-xs text-alten-red hover:underline disabled:opacity-50">Eliminar</button>
        </div>
      </td>
    </tr>
  )
}

// ─── Admin: leave confirmation modal ─────────────────────────────────────────

function LeaveModal({ projectName, onConfirm, onCancel, isPending }: {
  projectName: string; onConfirm: () => void; onCancel: () => void; isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-base font-semibold text-alten-body mb-2">Abandonar proyecto</h3>
        <p className="text-sm text-alten-body mb-6">
          ¿Seguro que quieres abandonar <strong>{projectName}</strong>? La participación quedará cerrada con fecha de ayer.
        </p>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} disabled={isPending}
            className="rounded border border-alten-border px-4 py-2 text-sm text-alten-body hover:bg-alten-light disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={isPending}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {isPending ? 'Abandonando…' : 'Abandonar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Admin view ───────────────────────────────────────────────────────────────

function AdminProjectView({ projectId }: { projectId: string }) {
  const navigate = useNavigate()
  const { person } = useCurrentUser()

  const { data: projects } = useProjects()
  const project = (projects ?? []).find((p) => p.id === projectId)

  const { data: assignment, isLoading: loadingAssignment } = useMyProjectAssignment(projectId)
  const { data: usageEntries, isLoading: loadingUsage } = useProjectUsage(projectId)
  const { data: aiAccounts, isLoading: loadingAi } = useProjectAiAccounts(projectId)
  const leaveProject = useLeaveProject(person?.id)

  const [showAddUsage, setShowAddUsage] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const isActive =
    assignment !== null &&
    assignment !== undefined &&
    (assignment.valid_to === null || assignment.valid_to >= today)

  const totalCost = (usageEntries ?? []).reduce((sum, e) => sum + Number(e.calculated_cost), 0)

  async function handleLeave() {
    await leaveProject.mutateAsync(projectId)
    setShowLeaveModal(false)
    navigate('/dashboard')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <button type="button" onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: 4 }}>
        <svg style={{ width: 14, height: 14, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver
      </button>

      {/* Project info */}
      {project ? (
        <div className="rounded-xl border border-alten-border bg-white p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-mono text-xs text-alten-mid">{project.code}</span>
                <h1 className="text-lg font-bold text-alten-body">{project.name}</h1>
              </div>
              <p className="text-sm text-alten-mid">{project.client_name}</p>
            </div>
            {isActive && (
              <span className="flex-shrink-0 inline-flex items-center rounded-full bg-alten-mid-blue px-2.5 py-0.5 text-xs font-medium text-alten-dark">
                Participando
              </span>
            )}
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <dt className="text-xs text-alten-mid uppercase tracking-wider">Inicio</dt>
              <dd className="font-medium text-alten-body mt-0.5">{project.start_date}</dd>
            </div>
            <div>
              <dt className="text-xs text-alten-mid uppercase tracking-wider">Fin</dt>
              <dd className="font-medium text-alten-body mt-0.5">{project.end_date ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-alten-mid uppercase tracking-wider">Presupuesto mensual</dt>
              <dd className="font-medium text-alten-body mt-0.5">
                {project.monthly_budget ? `€${Number(project.monthly_budget).toFixed(2)}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-alten-mid uppercase tracking-wider">Gasto registrado</dt>
              <dd className="font-medium text-alten-body mt-0.5">€{totalCost.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="rounded-xl border border-alten-border bg-white p-5">
          <p className="text-sm text-alten-mid">Cargando información del proyecto…</p>
        </div>
      )}

      {/* Participation */}
      {!loadingAssignment && assignment && (
        <div className="rounded-xl border border-alten-border bg-white p-5">
          <h2 className="text-sm font-semibold text-alten-body mb-3">Mi participación</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <dt className="text-xs text-alten-mid uppercase tracking-wider">Desde</dt>
              <dd className="font-medium text-alten-body mt-0.5">{assignment.valid_from}</dd>
            </div>
            <div>
              <dt className="text-xs text-alten-mid uppercase tracking-wider">Hasta</dt>
              <dd className="font-medium text-alten-body mt-0.5">{assignment.valid_to ?? 'Indefinido'}</dd>
            </div>
          </dl>
          {isActive && (
            <button type="button" onClick={() => setShowLeaveModal(true)}
              className="rounded border border-alten-red/30 px-3 py-1.5 text-xs font-medium text-alten-red hover:bg-red-50">
              Abandonar proyecto
            </button>
          )}
        </div>
      )}

      {/* Usage tracking */}
      <div className="rounded-xl border border-alten-border bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-alten-body">Mis IAs en este proyecto</h2>
          {isActive && !showAddUsage && (
            <button type="button" onClick={() => setShowAddUsage(true)}
              className="rounded bg-alten-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-alten-hover">
              + Añadir IA
            </button>
          )}
        </div>
        {showAddUsage && (
          <div className="mb-4">
            <AddUsageForm projectId={projectId} onClose={() => setShowAddUsage(false)} />
          </div>
        )}
        {loadingUsage ? (
          <p className="text-sm text-alten-mid">Cargando registros…</p>
        ) : (usageEntries ?? []).length === 0 ? (
          <p className="text-sm text-alten-mid">No hay registros de uso todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="pb-2 pr-4 text-xs font-medium text-alten-mid uppercase tracking-wider">Herramienta</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-alten-mid uppercase tracking-wider">Período</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-alten-mid uppercase tracking-wider">Horas</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-alten-mid uppercase tracking-wider">Coste</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {(usageEntries ?? []).map((entry) => (
                  <UsageRow key={entry.id} entry={entry} projectId={projectId} />
                ))}
              </tbody>
              {(usageEntries ?? []).length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-alten-border">
                    <td colSpan={3} className="pt-2 pr-4 text-xs font-semibold text-alten-mid uppercase">Total</td>
                    <td className="pt-2 text-sm font-bold text-alten-body">€{totalCost.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* AI accounts charts */}
      <div className="rounded-xl border border-alten-border bg-white p-5">
        <h2 className="text-sm font-semibold text-alten-body mb-4">Gráficas de coste IA</h2>
        {loadingAi ? (
          <p className="text-sm text-alten-mid">Cargando…</p>
        ) : (
          <ProjectAiSection accounts={aiAccounts ?? []} />
        )}
      </div>

      {showLeaveModal && project && (
        <LeaveModal
          projectName={project.name}
          onConfirm={() => void handleLeave()}
          onCancel={() => setShowLeaveModal(false)}
          isPending={leaveProject.isPending}
        />
      )}
    </div>
  )
}

// ─── Standard user view (read-only charts) ────────────────────────────────────

function UserProjectView({ projectId }: { projectId: string }) {
  const navigate = useNavigate()
  const { data: projects } = useProjects()
  const project = (projects ?? []).find((p) => p.id === projectId)
  const { data: aiAccounts, isLoading: loadingAi, error: aiError } = useProjectAiAccounts(projectId)

  return (
    <div className="space-y-6 max-w-3xl">
      <button type="button" onClick={() => navigate('/dashboard')} className="back-btn" style={{ marginBottom: 4 }}>
        <svg style={{ width: 14, height: 14, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver a mis proyectos
      </button>

      {/* Project info */}
      {project ? (
        <div className="rounded-xl border border-alten-border bg-white p-5 space-y-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-mono text-xs text-alten-mid">{project.code}</span>
              <h1 className="text-lg font-bold text-alten-body">{project.name.replace(/_/g, ' ')}</h1>
            </div>
            <p className="text-sm text-alten-mid">{project.client_name}</p>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-xs text-alten-mid uppercase tracking-wider">Inicio</dt>
              <dd className="font-medium text-alten-body mt-0.5">{project.start_date}</dd>
            </div>
            <div>
              <dt className="text-xs text-alten-mid uppercase tracking-wider">Fin</dt>
              <dd className="font-medium text-alten-body mt-0.5">{project.end_date ?? '—'}</dd>
            </div>
            {project.total_budget != null && (
              <div>
                <dt className="text-xs text-alten-mid uppercase tracking-wider">Presupuesto total</dt>
                <dd className="font-medium text-alten-body mt-0.5">€{Number(project.total_budget).toFixed(2)}</dd>
              </div>
            )}
          </dl>
        </div>
      ) : (
        <div className="rounded-xl border border-alten-border bg-white p-5">
          <p className="text-sm text-alten-mid">Cargando información del proyecto…</p>
        </div>
      )}

      {/* AI cost charts */}
      <div className="rounded-xl border border-alten-border bg-white p-5">
        <h2 className="text-sm font-semibold text-alten-body mb-4">Gráficas de coste IA</h2>
        {loadingAi ? (
          <p className="text-sm text-alten-mid">Cargando…</p>
        ) : aiError ? (
          <p className="text-sm text-alten-red">No se pudieron cargar las gráficas.</p>
        ) : (
          <ProjectAiSection accounts={aiAccounts ?? []} />
        )}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { isAdmin } = useCurrentUser()

  if (!projectId) return null

  return isAdmin
    ? <AdminProjectView projectId={projectId} />
    : <UserProjectView projectId={projectId} />
}
