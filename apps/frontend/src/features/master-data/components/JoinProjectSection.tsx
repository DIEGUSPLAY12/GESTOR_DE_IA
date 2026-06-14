import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects, usePersonAssignments, useJoinProject } from '../api/hooks.js'
import type { Project } from '../types.js'

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

// ─── Main section ─────────────────────────────────────────────────────────────

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

  // BUG 1 fix: active assignment = valid_to is null OR valid_to >= today
  // (if the user abandoned, valid_to is set to yesterday so it won't match)
  const joinedProjectIds = new Set(
    (myAssignments ?? [])
      .filter((a) => a.valid_to === null || a.valid_to >= today)
      .map((a) => a.project_id),
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
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Ver proyecto
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
          </div>
        )
      })}
    </div>
  )
}
