import { useState, useId, type FormEvent } from 'react'
import { useCurrentUser } from '../../../lib/useCurrentUser.js'
import { useAccounts, useProjects, usePersonAssignments } from '../../master-data/api/hooks.js'
import { useLogUsage } from '../api/hooks.js'
import type { UsageLogEntry } from '../api/hooks.js'

interface Props {
  periodMonth?: string
}

export function UsageForm({ periodMonth: initialPeriod }: Props) {
  const { person, isAdmin } = useCurrentUser()
  const { data: allProjects } = useProjects()
  const { data: assignments } = usePersonAssignments(person?.id ?? '')
  const { data: allAccounts } = useAccounts()
  const logUsage = useLogUsage()

  const today = new Date().toISOString().slice(0, 7)
  const projectSelectId = useId()
  const accountSelectId = useId()
  const unitsId = useId()
  const labelId = useId()
  const notesId = useId()
  const periodId = useId()

  const [projectId, setProjectId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [unitsUsed, setUnitsUsed] = useState('')
  const [unitLabel, setUnitLabel] = useState('hours')
  const [notes, setNotes] = useState('')
  const [period, setPeriod] = useState(initialPeriod ?? today)
  const [confirmed, setConfirmed] = useState<UsageLogEntry | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  // Projects the current user is assigned to (admins see all)
  const assignedIds = new Set(assignments?.map((a) => a.project_id) ?? [])
  const userProjects = (allProjects ?? []).filter((p) => {
    if (p.deleted_at) return false
    return isAdmin || assignedIds.has(p.id)
  })

  // Active accounts only
  const activeAccounts = (allAccounts ?? []).filter((a) => {
    if (a.deleted_at) return false
    if (a.valid_to && a.valid_to < today) return false
    return true
  })

  // Real-time cost preview
  const selectedAccount = activeAccounts.find((a) => a.id === accountId)
  const unitPrice =
    selectedAccount?.pricing_plan?.unit_price != null
      ? Number(selectedAccount.pricing_plan.unit_price)
      : null
  const parsedUnits = Number(unitsUsed)
  const previewCost =
    unitPrice !== null && parsedUnits > 0
      ? Math.round(parsedUnits * unitPrice * 10000) / 10000
      : null
  const currency = selectedAccount?.pricing_plan?.currency ?? 'EUR'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)
    setConfirmed(null)

    try {
      const result = await logUsage.mutateAsync({
        account_id: accountId,
        project_id: projectId,
        units_used: parsedUnits,
        period_month: period,
        ...(unitLabel ? { unit_label: unitLabel } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      })
      setConfirmed(result)
      setProjectId('')
      setAccountId('')
      setUnitsUsed('')
      setNotes('')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al registrar uso')
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-800">Registrar uso de IA</h2>

      {confirmed && (
        <div role="status" className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Uso registrado correctamente — coste:{' '}
          <strong>
            {Number(confirmed.calculated_cost).toFixed(4)} {confirmed.currency}
          </strong>
        </div>
      )}

      {serverError && (
        <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={(e) => { void handleSubmit(e) }} noValidate className="space-y-4">
        {/* Project selector */}
        <div>
          <label htmlFor={projectSelectId} className="block text-sm font-medium text-gray-700 mb-1">
            Proyecto
          </label>
          <select
            id={projectSelectId}
            required
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">— Selecciona un proyecto —</option>
            {userProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Account selector */}
        <div>
          <label htmlFor={accountSelectId} className="block text-sm font-medium text-gray-700 mb-1">
            Cuenta de IA
          </label>
          <select
            id={accountSelectId}
            required
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">— Selecciona una cuenta —</option>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.external_identifier}
                {a.pricing_plan ? ` (${a.pricing_plan.name})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Units + label */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor={unitsId} className="block text-sm font-medium text-gray-700 mb-1">
              Unidades
            </label>
            <input
              id={unitsId}
              type="number"
              min="0.0001"
              step="0.25"
              required
              className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={unitsUsed}
              onChange={(e) => setUnitsUsed(e.target.value)}
            />
          </div>
          <div className="w-36">
            <label htmlFor={labelId} className="block text-sm font-medium text-gray-700 mb-1">
              Unidad
            </label>
            <input
              id={labelId}
              type="text"
              placeholder="hours"
              className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
            />
          </div>
        </div>

        {/* Period */}
        <div>
          <label htmlFor={periodId} className="block text-sm font-medium text-gray-700 mb-1">
            Período
          </label>
          <input
            id={periodId}
            type="month"
            required
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor={notesId} className="block text-sm font-medium text-gray-700 mb-1">
            Notas <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            id={notesId}
            rows={2}
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Cost preview */}
        {previewCost !== null && (
          <div className="rounded bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
            Coste estimado:{' '}
            <strong>
              {previewCost.toFixed(4)} {currency}
            </strong>
          </div>
        )}

        <button
          type="submit"
          disabled={logUsage.isPending || !projectId || !accountId || !unitsUsed}
          className="w-full rounded bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {logUsage.isPending ? 'Registrando…' : 'Registrar uso'}
        </button>
      </form>
    </div>
  )
}
