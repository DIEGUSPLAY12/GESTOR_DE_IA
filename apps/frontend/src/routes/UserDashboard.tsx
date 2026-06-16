import { useNavigate, useLocation } from 'react-router-dom'
import { useCurrentUser } from '../lib/useCurrentUser.js'
import { usePersonAssignments } from '../features/master-data/api/hooks.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_ES = ['ene.','feb.','mar.','abr.','may.','jun.','jul.','ago.','sep.','oct.','nov.','dic.']

function formatDateEU(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${parseInt(d ?? '1', 10)} ${MONTHS_ES[parseInt(m ?? '1', 10) - 1] ?? ''} ${y}`
}

function formatDateFormal(date: Date): string {
  const raw = date.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyProjects() {
  return (
    <div className="py-16 text-center">
      <svg
        className="mx-auto mb-4"
        style={{ width: 48, height: 48, color: '#C0C0C8' }}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v.75A2.25 2.25 0 0 1 19.5 17.25h-15A2.25 2.25 0 0 1 2.25 15.75V15m19.5 0-3-3m0 0-3 3m3-3v12" />
      </svg>
      <p style={{ fontSize: 15, fontWeight: 500, color: '#484848', marginBottom: 8 }}>
        No tiene proyectos asignados
      </p>
      <p style={{ fontSize: 13, color: '#8C8C9A', maxWidth: 360, margin: '0 auto' }}>
        Contacte con su administrador para que le asigne un proyecto.
      </p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UserDashboard() {
  const { person } = useCurrentUser()
  const navigate = useNavigate()
  const location = useLocation()
  const accessDenied = (location.state as { accessDenied?: boolean } | null)?.accessDenied ?? false

  const { data: assignments, isLoading } = usePersonAssignments(person?.id ?? '')

  const today = new Date().toISOString().slice(0, 10)
  const activeAssignments = (assignments ?? []).filter(
    (a) => a.valid_to === null || a.valid_to >= today,
  )

  const initials = person?.full_name
    ? person.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?'

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 40, height: 40, background: '#008BD2', fontSize: 14, fontWeight: 700, color: '#fff' }}
            >
              {initials}
            </div>
            <div>
              <p style={{ fontSize: 13, color: '#8C8C9A', lineHeight: 1.3 }}>Bienvenido,</p>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#043962', lineHeight: 1.3 }}>
                {person?.full_name ?? '—'}
              </p>
            </div>
          </div>
          <h1 className="type-page-title">Mis Proyectos</h1>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1" style={{ marginTop: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', color: '#008BD2', textTransform: 'uppercase' }}>
            ALTEN España
          </span>
          <span style={{ fontSize: 13, color: '#8C8C9A' }}>
            {formatDateFormal(new Date())}
          </span>
        </div>
      </div>

      {/* Access denied banner */}
      {accessDenied && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-lg border border-alten-red/30 bg-red-50 px-4 py-3"
        >
          <svg className="mt-0.5 flex-shrink-0" style={{ width: 16, height: 16, color: '#E30513' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p style={{ fontSize: 13, color: '#E30513', fontWeight: 500 }}>
            No tiene permisos para acceder a esa sección.
          </p>
        </div>
      )}

      {/* Project list */}
      {isLoading ? (
        <div role="status" className="flex items-center gap-2 py-8" style={{ fontSize: 14, color: '#8C8C9A' }}>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando proyectos…
        </div>
      ) : activeAssignments.length === 0 ? (
        <EmptyProjects />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeAssignments.map((assignment) => {
            const project = assignment.project
            if (!project) return null
            const displayName = project.name.replace(/_/g, ' ')

            return (
              <div key={assignment.id} className="project-card">
                <div className="flex items-start justify-between gap-4">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {/* Code + name */}
                    <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: 6 }}>
                      <span className="badge-code">{project.code}</span>
                      <span className="type-card-title">{displayName}</span>
                    </div>

                    {/* Dates */}
                    <p style={{ fontSize: 13, color: '#8C8C9A' }}>
                      {formatDateEU(project.start_date)}
                      {project.end_date
                        ? ` → ${formatDateEU(project.end_date)}`
                        : ' → (abierto)'}
                    </p>

                    {/* My participation dates */}
                    <p style={{ fontSize: 12, color: '#8C8C9A', marginTop: 4 }}>
                      Incorporación: {formatDateEU(assignment.valid_from)}
                      {assignment.valid_to ? ` — ${formatDateEU(assignment.valid_to)}` : ''}
                    </p>
                  </div>

                  {/* Action */}
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="btn-primary btn-sm flex-shrink-0"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Ver gráficas
                    <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
