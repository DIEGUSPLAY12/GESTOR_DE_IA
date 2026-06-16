import { useState, useEffect, type FormEvent } from 'react'
import { usePersons, useCreateProject, useUpdateProject } from '../api/hooks.js'
import type { Project, IqpValue } from '../types.js'
import { IQP_OPTIONS } from '../types.js'

interface ProjectFormProps {
  project?: Project
  onSuccess?: () => void
  onCancel?: () => void
}

// Validates CO/WO project code: C|W + 8 digits + '.' + 2 digits  (e.g. C00000145.01)
const CODE_RE = /^[CW]\d{8}\.\d{2}$/

function validateCode(code: string): string | null {
  if (!code) return 'El código es obligatorio'
  if (!CODE_RE.test(code)) return 'Formato: C|W seguido de 8 dígitos, punto y 2 dígitos (ej. C00000145.01)'
  return null
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const isEdit = Boolean(project)
  const { data: persons } = usePersons()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  const [code, setCode] = useState(project?.code ?? '')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [name, setName] = useState(project?.name ?? '')
  const [clientName, setClientName] = useState(project?.client_name ?? '')
  const [iqp, setIqp] = useState<IqpValue | ''>(project?.iqp ?? '')
  const [managerId, setManagerId] = useState(project?.project_manager_id ?? '')
  const [deliveryManagerId, setDeliveryManagerId] = useState(project?.delivery_manager_id ?? '')
  const [projectLeaderId, setProjectLeaderId] = useState(project?.project_leader_id ?? '')
  const [projectLeader2Id, setProjectLeader2Id] = useState(project?.project_leader_2_id ?? '')
  const [startDate, setStartDate] = useState(project?.start_date ?? '')
  const [endDate, setEndDate] = useState(project?.end_date ?? '')
  const [totalBudget, setTotalBudget] = useState(
    project?.total_budget != null ? String(project.total_budget) : '',
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCode(project?.code ?? '')
    setCodeError(null)
    setName(project?.name ?? '')
    setClientName(project?.client_name ?? '')
    setIqp(project?.iqp ?? '')
    setManagerId(project?.project_manager_id ?? '')
    setDeliveryManagerId(project?.delivery_manager_id ?? '')
    setProjectLeaderId(project?.project_leader_id ?? '')
    setProjectLeader2Id(project?.project_leader_2_id ?? '')
    setStartDate(project?.start_date ?? '')
    setEndDate(project?.end_date ?? '')
    setTotalBudget(project?.total_budget != null ? String(project.total_budget) : '')
    setError(null)
  }, [project?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const activePersons = (persons ?? []).filter((p) => p.deleted_at === null)
  const isPending = createProject.isPending || updateProject.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isEdit) {
      const cErr = validateCode(code)
      if (cErr) { setCodeError(cErr); return }
    }

    if (!totalBudget || Number(totalBudget) <= 0) {
      setError('El presupuesto total es obligatorio y debe ser mayor que 0')
      return
    }

    try {
      if (isEdit && project) {
        await updateProject.mutateAsync({
          id: project.id,
          name,
          client_name: clientName,
          ...(iqp ? { iqp } : {}),
          project_manager_id: managerId,
          ...(deliveryManagerId ? { delivery_manager_id: deliveryManagerId } : {}),
          ...(projectLeaderId ? { project_leader_id: projectLeaderId } : {}),
          ...(projectLeader2Id ? { project_leader_2_id: projectLeader2Id } : {}),
          start_date: startDate,
          ...(endDate ? { end_date: endDate } : {}),
          total_budget: Number(totalBudget),
        })
      } else {
        await createProject.mutateAsync({
          code,
          name,
          client_name: clientName,
          ...(iqp ? { iqp } : {}),
          project_manager_id: managerId,
          ...(deliveryManagerId ? { delivery_manager_id: deliveryManagerId } : {}),
          ...(projectLeaderId ? { project_leader_id: projectLeaderId } : {}),
          ...(projectLeader2Id ? { project_leader_2_id: projectLeader2Id } : {}),
          start_date: startDate,
          ...(endDate ? { end_date: endDate } : {}),
          total_budget: Number(totalBudget),
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
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <h3 className="text-lg font-semibold text-alten-body">
        {isEdit ? `Editar proyecto — ${project!.code}` : 'Nuevo proyecto'}
      </h3>

      {error && (
        <div role="alert" className="rounded border border-alten-red/30 bg-red-50 px-3 py-2 text-sm text-alten-red">
          {error}
        </div>
      )}

      {/* ── Identificación ────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold text-alten-mid uppercase tracking-wide mb-2">Identificación</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Cliente — primer campo */}
          <div className="sm:col-span-2">
            <label htmlFor="proj-client" className={labelClass}>
              Cliente <span aria-hidden="true" style={{ color: '#E30513' }}>*</span>
            </label>
            <input
              id="proj-client"
              type="text"
              required
              className={inputClass}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>

          {!isEdit && (
            <div>
              <label htmlFor="proj-code" className={labelClass}>
                Código <span aria-hidden="true" style={{ color: '#E30513' }}>*</span>
              </label>
              <input
                id="proj-code"
                type="text"
                required
                className={`${inputClass} ${codeError ? 'border-alten-red focus:ring-alten-red' : ''}`}
                value={code}
                onChange={(e) => { setCode(e.target.value); setCodeError(null) }}
                placeholder="C00000145.01"
              />
              {codeError && (
                <p className="mt-1 text-xs text-alten-red">{codeError}</p>
              )}
            </div>
          )}

          <div className={isEdit ? 'sm:col-span-2' : ''}>
            <label htmlFor="proj-name" className={labelClass}>
              Nombre del proyecto <span aria-hidden="true" style={{ color: '#E30513' }}>*</span>
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
            <label htmlFor="proj-iqp" className={labelClass}>IQP</label>
            <select
              id="proj-iqp"
              className={inputClass}
              value={iqp}
              onChange={(e) => setIqp(e.target.value as IqpValue | '')}
            >
              <option value="">— Sin IQP —</option>
              {IQP_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* ── Equipo ────────────────────────────────────────────────── */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-alten-mid uppercase tracking-wide mb-2">Equipo</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { id: 'proj-manager', label: 'Project Manager', value: managerId, setter: setManagerId, required: true },
            { id: 'proj-dm', label: 'Delivery Manager', value: deliveryManagerId, setter: setDeliveryManagerId },
            { id: 'proj-pl', label: 'Project Leader', value: projectLeaderId, setter: setProjectLeaderId },
            { id: 'proj-pl2', label: 'Project Leader 2', value: projectLeader2Id, setter: setProjectLeader2Id },
          ].map(({ id, label, value, setter, required }) => (
            <div key={id}>
              <label htmlFor={id} className={labelClass}>
                {label}{required && <span aria-hidden="true" style={{ color: '#E30513' }}> *</span>}
              </label>
              <select
                id={id}
                required={required}
                className={inputClass}
                value={value}
                onChange={(e) => setter(e.target.value)}
              >
                <option value="">— Sin asignar —</option>
                {activePersons.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </fieldset>

      {/* ── Fechas y presupuesto ──────────────────────────────────── */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-alten-mid uppercase tracking-wide mb-2">Fechas y presupuesto</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="proj-start" className={labelClass}>
              Fecha inicio <span aria-hidden="true" style={{ color: '#E30513' }}>*</span>
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
              Fecha fin <span className="text-alten-mid text-xs font-normal">(opcional)</span>
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
              Presupuesto total € <span aria-hidden="true" style={{ color: '#E30513' }}>*</span>
            </label>
            <input
              id="proj-budget"
              type="number"
              required
              min={0.01}
              step={0.01}
              className={inputClass}
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      </fieldset>

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
