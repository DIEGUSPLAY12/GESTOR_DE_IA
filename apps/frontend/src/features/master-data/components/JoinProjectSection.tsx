import { useState, type FormEvent } from 'react'
import { useProjects, usePersonAssignments, useJoinProject, useMyAccounts } from '../api/hooks.js'
import { useLogUsage } from '../../usage/api/hooks.js'
import type { Project, MySubscription } from '../types.js'

// ─── Join form (for projects not yet joined) ──────────────────────────────────

interface JoinFormProps {
  project: Project
  personId: string
  onSuccess: () => void
  onCancel: () => void
}

function JoinForm({ project, personId, onSuccess, onCancel }: JoinFormProps) {
  const joinProject = useJoinProject(personId)
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const minStart = project.start_date
  const maxEnd = project.end_date ?? undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await joinProject.mutateAsync({
        projectId: project.id,
        valid_from: validFrom,
        ...(validTo ? { valid_to: validTo } : {}),
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al unirse al proyecto')
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-3 border-t border-gray-100 pt-3">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Fecha inicio <span aria-hidden="true">*</span>
          </label>
          <input
            type="date"
            required
            min={minStart}
            {...(maxEnd ? { max: maxEnd } : {})}
            value={validFrom}
            onChange={(e) => { setValidFrom(e.target.value); setValidTo('') }}
            className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-0.5 text-xs text-gray-400">
            Desde {minStart}{maxEnd ? ` hasta ${maxEnd}` : ''}
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Fecha fin <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            type="date"
            min={validFrom || minStart}
            {...(maxEnd ? { max: maxEnd } : {})}
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!validFrom || joinProject.isPending}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {joinProject.isPending ? 'Guardando…' : 'Confirmar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Usage form (for joined projects) ────────────────────────────────────────

interface UsageFormProps {
  projectId: string
  myTools: MySubscription[]
  onSuccess: () => void
  onCancel: () => void
}

function UsageForm({ projectId, myTools, onSuccess, onCancel }: UsageFormProps) {
  const logUsage = useLogUsage()
  const today = new Date().toISOString().slice(0, 7)

  const [accountId, setAccountId] = useState('')
  const [months, setMonths] = useState('')
  const [periodMonth, setPeriodMonth] = useState(today)
  const [error, setError] = useState<string | null>(null)

  const selectedTool = myTools.find((t) => t.account_id === accountId)
  const unitPrice = selectedTool?.account?.pricing_plan?.unit_price
    ? Number(selectedTool.account.pricing_plan.unit_price)
    : null
  const parsedMonths = Number(months)
  const previewCost =
    unitPrice !== null && unitPrice !== undefined && parsedMonths > 0
      ? (Math.round(parsedMonths * unitPrice * 100) / 100).toFixed(2)
      : null
  const currency = selectedTool?.account?.pricing_plan?.currency ?? 'EUR'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!accountId || !months || parsedMonths <= 0) return
    try {
      await logUsage.mutateAsync({
        account_id: accountId,
        project_id: projectId,
        units_used: parsedMonths,
        unit_label: 'meses',
        period_month: periodMonth,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar uso')
    }
  }

  if (myTools.length === 0) {
    return (
      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500">
          Añade tus herramientas de IA en la pestaña{' '}
          <span className="font-medium text-blue-600">Mis herramientas</span> para poder registrar uso.
        </p>
        <button type="button" onClick={onCancel} className="mt-2 text-xs text-gray-400 hover:text-gray-600">
          Cerrar
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-3 border-t border-gray-100 pt-3">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Herramienta de IA <span aria-hidden="true">*</span>
          </label>
          <select
            required
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Selecciona —</option>
            {myTools.map((t) => (
              <option key={t.account_id} value={t.account_id}>
                {t.account?.pricing_plan?.name ?? t.account?.external_identifier ?? t.account_id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Meses de uso <span aria-hidden="true">*</span>
          </label>
          <input
            type="number"
            required
            min="0.1"
            step="0.5"
            placeholder="ej. 2"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
        <input
          type="month"
          value={periodMonth}
          onChange={(e) => setPeriodMonth(e.target.value)}
          className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {previewCost !== null && (
        <div className="rounded bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
          Coste estimado: <strong>{previewCost} {currency}</strong>
          <span className="text-blue-500 ml-2 text-xs">
            ({parsedMonths} {parsedMonths === 1 ? 'mes' : 'meses'} × €{unitPrice?.toFixed(2)}/mes)
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!accountId || !months || parsedMonths <= 0 || logUsage.isPending}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {logUsage.isPending ? 'Guardando…' : 'Registrar gasto'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────

interface JoinProjectSectionProps {
  personId: string
}

export function JoinProjectSection({ personId }: JoinProjectSectionProps) {
  const { data: projects, isLoading } = useProjects()
  const { data: myAssignments } = usePersonAssignments(personId)
  const { data: myTools } = useMyAccounts()
  const [joiningProjectId, setJoiningProjectId] = useState<string | null>(null)
  const [loggingUsageProjectId, setLoggingUsageProjectId] = useState<string | null>(null)

  const activeProjects = (projects ?? []).filter((p) => p.deleted_at === null)

  const joinedProjectIds = new Set(
    (myAssignments ?? [])
      .filter((a) => a.valid_to === null)
      .map((a) => a.project_id),
  )

  const activeTools = (myTools ?? []).filter(
    (t) => t.account?.valid_to === null || t.account === null,
  )

  if (isLoading) {
    return <div role="status" className="py-4 text-sm text-gray-400">Cargando proyectos…</div>
  }

  if (activeProjects.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No hay proyectos disponibles.</p>
  }

  return (
    <div className="space-y-3">
      {activeProjects.map((project) => {
        const isJoined = joinedProjectIds.has(project.id)
        const isExpandingJoin = joiningProjectId === project.id
        const isExpandingUsage = loggingUsageProjectId === project.id

        return (
          <div key={project.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-gray-400">{project.code}</span>
                  <span className="font-medium text-gray-900 text-sm">{project.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {project.client_name}
                  {' · '}
                  {project.start_date}
                  {project.end_date ? ` → ${project.end_date}` : ' → (abierto)'}
                </p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                {isJoined ? (
                  <>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Participando
                    </span>
                    <button
                      type="button"
                      onClick={() => setLoggingUsageProjectId(isExpandingUsage ? null : project.id)}
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      {isExpandingUsage ? 'Cancelar' : 'Registrar uso IA'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setJoiningProjectId(isExpandingJoin ? null : project.id)}
                    className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    {isExpandingJoin ? 'Cancelar' : 'Unirse'}
                  </button>
                )}
              </div>
            </div>

            {isExpandingJoin && !isJoined && (
              <JoinForm
                project={project}
                personId={personId}
                onSuccess={() => setJoiningProjectId(null)}
                onCancel={() => setJoiningProjectId(null)}
              />
            )}

            {isExpandingUsage && isJoined && (
              <UsageForm
                projectId={project.id}
                myTools={activeTools}
                onSuccess={() => setLoggingUsageProjectId(null)}
                onCancel={() => setLoggingUsageProjectId(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
