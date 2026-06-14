import { useState, useEffect, type FormEvent } from 'react'
import { usePersons, useCreateProject, useUpdateProject } from '../api/hooks.js'
import type { Project } from '../types.js'

interface ProjectFormProps {
  project?: Project
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const isEdit = Boolean(project)
  const { data: persons } = usePersons()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  const [code, setCode] = useState(project?.code ?? '')
  const [name, setName] = useState(project?.name ?? '')
  const [clientName, setClientName] = useState(project?.client_name ?? '')
  const [managerId, setManagerId] = useState(project?.project_manager_id ?? '')
  const [startDate, setStartDate] = useState(project?.start_date ?? '')
  const [endDate, setEndDate] = useState(project?.end_date ?? '')
  const [budget, setBudget] = useState(
    project?.monthly_budget != null ? String(project.monthly_budget) : '',
  )
  const [error, setError] = useState<string | null>(null)

  // Sync fields when switching between projects in edit mode
  useEffect(() => {
    setCode(project?.code ?? '')
    setName(project?.name ?? '')
    setClientName(project?.client_name ?? '')
    setManagerId(project?.project_manager_id ?? '')
    setStartDate(project?.start_date ?? '')
    setEndDate(project?.end_date ?? '')
    setBudget(project?.monthly_budget != null ? String(project.monthly_budget) : '')
    setError(null)
  }, [project?.id])

  const activePersons = (persons ?? []).filter((p) => p.deleted_at === null)
  const isPending = createProject.isPending || updateProject.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (isEdit && project) {
        await updateProject.mutateAsync({
          id: project.id,
          name,
          client_name: clientName,
          project_manager_id: managerId,
          start_date: startDate,
          ...(endDate ? { end_date: endDate } : {}),
          ...(budget !== '' ? { monthly_budget: Number(budget) } : {}),
        })
      } else {
        await createProject.mutateAsync({
          code,
          name,
          client_name: clientName,
          project_manager_id: managerId,
          start_date: startDate,
          ...(endDate ? { end_date: endDate } : {}),
          ...(budget !== '' ? { monthly_budget: Number(budget) } : {}),
        })
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el proyecto')
    }
  }

  const inputClass =
    'block w-full rounded border border-alten-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alten-blue'
  const labelClass = 'block text-sm font-medium text-alten-body mb-1'

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <h3 className="text-lg font-semibold text-alten-body">
        {isEdit ? `Editar proyecto — ${project!.code}` : 'Nuevo proyecto'}
      </h3>

      {error && (
        <div role="alert" className="rounded border border-alten-red/30 bg-red-50 px-3 py-2 text-sm text-alten-red">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!isEdit && (
          <div>
            <label htmlFor="proj-code" className={labelClass}>
              Código <span aria-hidden="true">*</span>
            </label>
            <input
              id="proj-code"
              type="text"
              required
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="P-001"
            />
          </div>
        )}

        <div className={isEdit ? 'sm:col-span-2' : ''}>
          <label htmlFor="proj-name" className={labelClass}>
            Nombre <span aria-hidden="true">*</span>
          </label>
          <input
            id="proj-name"
            type="text"
            required
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="proj-client" className={labelClass}>
            Cliente <span aria-hidden="true">*</span>
          </label>
          <input
            id="proj-client"
            type="text"
            required
            className={inputClass}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="proj-manager" className={labelClass}>
            Project Manager <span aria-hidden="true">*</span>
          </label>
          <select
            id="proj-manager"
            required
            className={inputClass}
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {activePersons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="proj-start" className={labelClass}>
            Fecha inicio <span aria-hidden="true">*</span>
          </label>
          <input
            id="proj-start"
            type="date"
            required
            className={inputClass}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="proj-end" className={labelClass}>
            Fecha fin <span className="text-alten-mid text-xs">(opcional)</span>
          </label>
          <input
            id="proj-end"
            type="date"
            className={inputClass}
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="proj-budget" className={labelClass}>
            Presupuesto mensual € <span className="text-alten-mid text-xs">(opcional)</span>
          </label>
          <input
            id="proj-budget"
            type="number"
            min={0}
            step={0.01}
            className={inputClass}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-alten-body border border-alten-border rounded hover:bg-alten-light"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-alten-blue rounded hover:bg-alten-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear proyecto'}
        </button>
      </div>
    </form>
  )
}
