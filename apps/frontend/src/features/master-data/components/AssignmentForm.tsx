import { useState, useId } from 'react'
import { usePersons, useProjects, useAssignProject, usePersonAssignments } from '../api/hooks.js'
import type { AssignProjectInput } from '../types.js'

interface AssignmentFormProps {
  /** Pre-selected person; omit to show person selector. */
  personId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

function sumActivePercentages(
  assignments: { percentage: string; valid_to: string | null }[],
  proposedFrom: string,
  proposedTo: string | null,
): number {
  const overlappers = assignments.filter((a) => {
    const aTo = a.valid_to ?? '9999-12-31'
    const pTo = proposedTo ?? '9999-12-31'
    return a.valid_to === null || aTo >= proposedFrom
      ? proposedTo === null || pTo >= (a.valid_to ? a.valid_to : proposedFrom)
        ? true
        : false
      : false
  })
  return overlappers.reduce((sum, a) => sum + Number(a.percentage), 0)
}

export function AssignmentForm({ personId: prefillPersonId, onSuccess, onCancel }: AssignmentFormProps) {
  const formId = useId()

  const { data: persons } = usePersons()
  const { data: projects } = useProjects()
  const assignProject = useAssignProject()

  const [selectedPersonId, setSelectedPersonId] = useState(prefillPersonId ?? '')
  const [projectId, setProjectId] = useState('')
  const [percentage, setPercentage] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [percentageWarning, setPercentageWarning] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const effectivePersonId = prefillPersonId ?? selectedPersonId
  const { data: existingAssignments } = usePersonAssignments(effectivePersonId)

  function handlePercentageChange(value: string) {
    setPercentage(value)
    setPercentageWarning(null)

    const pct = Number(value)
    if (!Number.isFinite(pct) || pct <= 0 || !validFrom) return

    const currentTotal = sumActivePercentages(existingAssignments ?? [], validFrom, validTo || null)
    const projected = Math.round((currentTotal + pct) * 100) / 100

    if (projected > 100) {
      setPercentageWarning(
        `La dedicación acumulada quedaría en ${projected}% (actual: ${currentTotal}%). Supera el máximo del 100%.`,
      )
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    const pct = Number(percentage)
    if (!effectivePersonId || !projectId || !pct || !validFrom) return

    const input: AssignProjectInput & { personId: string } = {
      personId: effectivePersonId,
      project_id: projectId,
      percentage: pct,
      valid_from: validFrom,
      ...(validTo ? { valid_to: validTo } : {}),
    }

    try {
      await assignProject.mutateAsync(input)
      setProjectId('')
      setPercentage('')
      setValidFrom('')
      setValidTo('')
      setPercentageWarning(null)
      onSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar la asignación'
      setServerError(message)
    }
  }

  const activeProjects = (projects ?? []).filter((p) => p.deleted_at === null)
  const activePersons = (persons ?? []).filter((p) => p.deleted_at === null)

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={`${formId}-heading`}
      className="space-y-4"
    >
      <h3 id={`${formId}-heading`} className="text-lg font-semibold">
        Asignar consultor a proyecto
      </h3>

      {/* Person selector (only shown when personId not prefilled) */}
      {!prefillPersonId && (
        <div>
          <label htmlFor={`${formId}-person`} className="block text-sm font-medium text-gray-700 mb-1">
            Consultor <span aria-hidden="true">*</span>
          </label>
          <select
            id={`${formId}-person`}
            required
            value={selectedPersonId}
            onChange={(e) => setSelectedPersonId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">— Seleccionar persona —</option>
            {activePersons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Project */}
      <div>
        <label htmlFor={`${formId}-project`} className="block text-sm font-medium text-gray-700 mb-1">
          Proyecto <span aria-hidden="true">*</span>
        </label>
        <select
          id={`${formId}-project`}
          required
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">— Seleccionar proyecto —</option>
          {activeProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Percentage */}
      <div>
        <label htmlFor={`${formId}-pct`} className="block text-sm font-medium text-gray-700 mb-1">
          % Dedicación <span aria-hidden="true">*</span>
        </label>
        <input
          id={`${formId}-pct`}
          type="number"
          min={1}
          max={100}
          step={1}
          required
          value={percentage}
          onChange={(e) => handlePercentageChange(e.target.value)}
          aria-describedby={
            percentageWarning ? `${formId}-pct-warning` : serverError ? `${formId}-server-error` : undefined
          }
          aria-invalid={Boolean(percentageWarning || serverError)}
          className={`w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:outline-none ${
            percentageWarning
              ? 'border-amber-400 focus:ring-amber-400'
              : serverError
              ? 'border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {percentageWarning && (
          <p id={`${formId}-pct-warning`} role="alert" className="mt-1 text-sm text-amber-600">
            {percentageWarning}
          </p>
        )}
        {serverError && (
          <p id={`${formId}-server-error`} role="alert" className="mt-1 text-sm text-red-600">
            {serverError}
          </p>
        )}
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${formId}-from`} className="block text-sm font-medium text-gray-700 mb-1">
            Desde <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${formId}-from`}
            type="date"
            required
            value={validFrom}
            onChange={(e) => {
              setValidFrom(e.target.value)
              if (percentage) handlePercentageChange(percentage)
            }}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor={`${formId}-to`} className="block text-sm font-medium text-gray-700 mb-1">
            Hasta <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            id={`${formId}-to`}
            type="date"
            value={validTo}
            min={validFrom || undefined}
            onChange={(e) => setValidTo(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={assignProject.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
        >
          {assignProject.isPending ? 'Guardando…' : 'Guardar asignación'}
        </button>
      </div>
    </form>
  )
}
