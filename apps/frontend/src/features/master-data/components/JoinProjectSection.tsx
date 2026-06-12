import { useState, type FormEvent } from 'react'
import { useProjects, usePersonAssignments, useJoinProject } from '../api/hooks.js'
import type { Project } from '../types.js'

interface JoinFormProps {
  project: Project
  onSuccess: () => void
  onCancel: () => void
}

function JoinForm({ project, onSuccess, onCancel }: JoinFormProps) {
  const joinProject = useJoinProject()
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
      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}
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
          {minStart && (
            <p className="mt-0.5 text-xs text-gray-400">
              Desde {minStart}{maxEnd ? ` hasta ${maxEnd}` : ''}
            </p>
          )}
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

interface JoinProjectSectionProps {
  personId: string
}

export function JoinProjectSection({ personId }: JoinProjectSectionProps) {
  const { data: projects, isLoading } = useProjects()
  const { data: myAssignments } = usePersonAssignments(personId)
  const [joiningProjectId, setJoiningProjectId] = useState<string | null>(null)

  const activeProjects = (projects ?? []).filter((p) => p.deleted_at === null)

  const joinedProjectIds = new Set(
    (myAssignments ?? [])
      .filter((a) => a.valid_to === null)
      .map((a) => a.project_id),
  )

  if (isLoading) {
    return (
      <div role="status" className="py-4 text-sm text-gray-400">
        Cargando proyectos…
      </div>
    )
  }

  if (activeProjects.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">No hay proyectos disponibles.</p>
    )
  }

  return (
    <div className="space-y-3">
      {activeProjects.map((project) => {
        const isJoined = joinedProjectIds.has(project.id)
        const isExpanded = joiningProjectId === project.id

        return (
          <div
            key={project.id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
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

              <div className="flex-shrink-0">
                {isJoined ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Participando
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setJoiningProjectId(isExpanded ? null : project.id)}
                    className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    {isExpanded ? 'Cancelar' : 'Unirse'}
                  </button>
                )}
              </div>
            </div>

            {isExpanded && !isJoined && (
              <JoinForm
                project={project}
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
