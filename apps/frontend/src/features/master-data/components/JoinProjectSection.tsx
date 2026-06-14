import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects, usePersonAssignments, useJoinProject } from '../api/hooks.js'
import type { Project } from '../types.js'

// ─── Utilidades de fecha ──────────────────────────────────────────────────────

const MONTHS_ES = ['ene.','feb.','mar.','abr.','may.','jun.','jul.','ago.','sep.','oct.','nov.','dic.']

function formatDateEU(iso: string): string {
  const parts = iso.split('-')
  const y = parts[0] ?? ''
  const m = parseInt(parts[1] ?? '1', 10)
  const d = parseInt(parts[2] ?? '1', 10)
  return `${d} ${MONTHS_ES[m - 1] ?? ''} ${y}`
}

function daysRemaining(endDateIso: string): number {
  const end = new Date(`${endDateIso}T00:00:00`)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - now.getTime()) / 86400000)
}

function formatProjectName(raw: string): string {
  return raw.replace(/_/g, ' ')
}

// ─── Icono estado vacío ───────────────────────────────────────────────────────

function EmptyProjectsIcon() {
  return (
    <svg
      className="mx-auto mb-4"
      style={{ width: 48, height: 48, color: '#C0C0C8' }}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v.75A2.25 2.25 0 0 1 19.5 17.25h-15A2.25 2.25 0 0 1 2.25 15.75V15m19.5 0-3-3m0 0-3 3m3-3v12" />
    </svg>
  )
}

// ─── Formulario de incorporación ──────────────────────────────────────────────

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
    } catch {
      setError('No se ha podido completar la operación. Inténtelo de nuevo o contacte con soporte técnico.')
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-5 pt-5 border-t border-alten-border" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && <div role="alert" className="alert-error">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`from-${project.id}`} className="type-form-label block mb-1.5">
            Fecha de incorporación <span aria-hidden="true" style={{ color: '#E30513' }}>*</span>
          </label>
          <input
            id={`from-${project.id}`}
            type="date"
            required
            min={minStart}
            {...(maxEnd ? { max: maxEnd } : {})}
            value={validFrom}
            onChange={(e) => { setValidFrom(e.target.value); setValidTo('') }}
            className="field-input"
          />
          <p className="type-body-sm mt-1">
            Rango: {formatDateEU(minStart)}{maxEnd ? ` — ${formatDateEU(maxEnd)}` : ' en adelante'}
          </p>
        </div>
        <div>
          <label htmlFor={`to-${project.id}`} className="type-form-label block mb-1.5">
            Fecha de fin{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#8C8C9A', fontSize: 12 }}>(opcional)</span>
          </label>
          <input
            id={`to-${project.id}`}
            type="date"
            min={validFrom || minStart}
            {...(maxEnd ? { max: maxEnd } : {})}
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            className="field-input"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!validFrom || joinProject.isPending}
          className="btn-primary btn-sm"
        >
          {joinProject.isPending ? 'Procesando…' : 'Confirmar incorporación'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary btn-sm">
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

  const todayISO = new Date().toISOString().slice(0, 10)
  const activeProjects = (projects ?? []).filter((p) => p.deleted_at === null)

  const joinedProjectIds = new Set(
    (myAssignments ?? [])
      .filter((a) => a.valid_to === null || a.valid_to >= todayISO)
      .map((a) => a.project_id),
  )

  if (isLoading) {
    return (
      <div role="status" className="flex items-center gap-2 py-6" style={{ fontSize: 14, color: '#8C8C9A' }}>
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
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <EmptyProjectsIcon />
        <p style={{ fontSize: 15, fontWeight: 500, color: '#484848', marginBottom: 8 }}>
          No hay proyectos disponibles en este momento
        </p>
        <p style={{ fontSize: 13, color: '#8C8C9A', maxWidth: 360, margin: '0 auto' }}>
          Contacte con el administrador si necesita acceso a un proyecto
          o si considera que esto es un error.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {activeProjects.map((project) => {
        const isJoined    = joinedProjectIds.has(project.id)
        const isExpanding = joiningProjectId === project.id
        const remaining   = project.end_date ? daysRemaining(project.end_date) : null
        const displayName = formatProjectName(project.name)

        return (
          <div key={project.id} className="project-card">
            <div className="flex items-start justify-between gap-4">
              {/* Info del proyecto */}
              <div style={{ minWidth: 0, flex: 1 }}>
                {/* Código + nombre */}
                <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: 6 }}>
                  <span className="badge-code">{project.code}</span>
                  <span className="type-card-title">{displayName}</span>
                </div>

                {/* Empresa y fechas */}
                <p style={{ fontSize: 13, color: '#8C8C9A', marginBottom: remaining !== null ? 4 : 0 }}>
                  {project.client_name}
                  <span style={{ margin: '0 8px', color: '#D1D5DB' }}>·</span>
                  {formatDateEU(project.start_date)}
                  {project.end_date ? ` → ${formatDateEU(project.end_date)}` : ' → (abierto)'}
                </p>

                {/* Días restantes */}
                {remaining !== null && (
                  <p style={{ fontSize: 12, fontWeight: 500, color: remaining > 0 ? '#008BD2' : '#E30513' }}>
                    {remaining > 0
                      ? `${remaining} días restantes`
                      : remaining === 0
                      ? 'Finaliza hoy'
                      : `Finalizado hace ${Math.abs(remaining)} días`}
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center flex-shrink-0" style={{ gap: 8 }}>
                {isJoined ? (
                  <>
                    <span className="badge-active">Participando</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      Ver proyecto
                      <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setJoiningProjectId(isExpanding ? null : project.id)}
                    className="btn-primary btn-sm"
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
