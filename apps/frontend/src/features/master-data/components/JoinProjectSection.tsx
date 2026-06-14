import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects, usePersonAssignments, useJoinProject } from '../api/hooks.js'
import type { Project } from '../types.js'

// ─── Icono estado vacío ───────────────────────────────────────────────────────

function EmptyProjectsIcon() {
  return (
    <svg className="mx-auto h-12 w-12 text-alten-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v.75A2.25 2.25 0 0 1 19.5 17.25h-15A2.25 2.25 0 0 1 2.25 15.75V15m19.5 0-3-3m0 0-3 3m3-3v12" />
    </svg>
  )
}

// ─── Formulario de unirse a proyecto ─────────────────────────────────────────

interface JoinFormProps {
  project: Project
  personId: string
  onSuccess: () => void
  onCancel: () => void
}

function JoinForm({ project, personId, onSuccess, onCancel }: JoinFormProps) {
  const joinProject = useJoinProject(personId)
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo]     = useState('')
  const [error, setError]         = useState<string | null>(null)

  const minStart = project.start_date
  const maxEnd   = project.end_date ?? undefined

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
      setError('No se ha podido completar la operación. Inténtelo de nuevo o contacte con soporte técnico.')
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 pt-4 border-t border-alten-border space-y-4">
      {error && (
        <div role="alert" className="alert-error">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-alten-body mb-1">
            Fecha de incorporación <span aria-hidden="true" className="text-alten-red">*</span>
          </label>
          <input
            type="date"
            required
            min={minStart}
            {...(maxEnd ? { max: maxEnd } : {})}
            value={validFrom}
            onChange={(e) => { setValidFrom(e.target.value); setValidTo('') }}
            className="field-input"
          />
          <p className="mt-1 text-caption">
            Rango permitido: {minStart}{maxEnd ? ` — ${maxEnd}` : ' en adelante'}
          </p>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-alten-body mb-1">
            Fecha de fin <span className="text-alten-mid font-normal">(opcional)</span>
          </label>
          <input
            type="date"
            min={validFrom || minStart}
            {...(maxEnd ? { max: maxEnd } : {})}
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            className="field-input"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!validFrom || joinProject.isPending}
          className="btn-primary text-xs px-4 py-2"
        >
          {joinProject.isPending ? 'Procesando…' : 'Confirmar incorporación'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary text-xs px-4 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Sección principal ────────────────────────────────────────────────────────

interface JoinProjectSectionProps {
  personId: string
}

export function JoinProjectSection({ personId }: JoinProjectSectionProps) {
  const navigate = useNavigate()
  const { data: projects, isLoading } = useProjects()
  const { data: myAssignments } = usePersonAssignments(personId)
  const [joiningProjectId, setJoiningProjectId] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const activeProjects = (projects ?? []).filter((p) => p.deleted_at === null)

  const joinedProjectIds = new Set(
    (myAssignments ?? [])
      .filter((a) => a.valid_to === null || a.valid_to >= today)
      .map((a) => a.project_id),
  )

  if (isLoading) {
    return (
      <div role="status" className="flex items-center gap-2 py-6 text-[14px] text-alten-mid">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Cargando información de proyectos…
      </div>
    )
  }

  if (activeProjects.length === 0) {
    return (
      <div className="py-12 text-center">
        <EmptyProjectsIcon />
        <p className="text-[15px] font-medium text-alten-body mb-1">
          No hay proyectos disponibles en este momento
        </p>
        <p className="text-caption max-w-sm mx-auto">
          Contacte con el administrador si necesita acceso a un proyecto o si considera que esto es un error.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activeProjects.map((project) => {
        const isJoined     = joinedProjectIds.has(project.id)
        const isExpanding  = joiningProjectId === project.id

        return (
          <div key={project.id} className="project-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {/* Código + nombre */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="badge-code">{project.code}</span>
                  <span className="text-[16px] font-semibold text-alten-dark leading-tight">
                    {project.name}
                  </span>
                </div>
                {/* Empresa y fechas */}
                <p className="text-caption">
                  {project.client_name}
                  <span className="mx-1.5 text-alten-border">·</span>
                  {project.start_date}
                  {project.end_date ? ` — ${project.end_date}` : ' — (abierto)'}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {isJoined ? (
                  <>
                    <span className="badge-active">Participando</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold
                                 bg-alten-blue text-white hover:bg-alten-dark transition-colors duration-200"
                    >
                      Ver proyecto
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setJoiningProjectId(isExpanding ? null : project.id)}
                    className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold
                               bg-alten-blue text-white hover:bg-alten-dark transition-colors duration-200"
                  >
                    {isExpanding ? 'Cancelar' : '+ Unirse al proyecto'}
                  </button>
                )}
              </div>
            </div>

            {isExpanding && !isJoined && (
              <JoinForm
                project={project}
                personId={personId}
                onSuccess={() => setJoiningProjectId(null)}
                onCancel={() => setJoiningProjectId(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
