import { useState, useId } from 'react'
import { useProjects, useDeleteProject } from '../api/hooks.js'
import type { Project } from '../types.js'

type SortKey = 'code' | 'name' | 'client_name' | 'start_date' | 'monthly_budget'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'active' | 'inactive' | 'all'

interface Column {
  key: SortKey
  label: string
}

const COLUMNS: Column[] = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nombre' },
  { key: 'client_name', label: 'Cliente' },
  { key: 'start_date', label: 'Inicio' },
  { key: 'monthly_budget', label: 'Presupuesto mensual' },
]

function isActive(project: Project): boolean {
  return project.deleted_at === null
}

function sortProjects(projects: Project[], key: SortKey, dir: SortDir): Project[] {
  return [...projects].sort((a, b) => {
    const av = a[key] ?? ''
    const bv = b[key] ?? ''
    const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true })
    return dir === 'asc' ? cmp : -cmp
  })
}

interface ProjectsTableProps {
  onEdit?: (project: Project) => void
}

export function ProjectsTable({ onEdit }: ProjectsTableProps) {
  const { data: projects, isLoading, error } = useProjects()
  const deleteProject = useDeleteProject()
  const filterLabelId = useId()

  const [sortKey, setSortKey] = useState<SortKey>('code')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function handleDelete(project: Project) {
    if (!window.confirm(`¿Eliminar el proyecto "${project.name}"? La acción es reversible.`)) return
    deleteProject.mutate(project.id)
  }

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="py-8 text-center text-alten-mid">
        Cargando proyectos…
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="py-8 text-center text-alten-red">
        Error al cargar proyectos: {error.message}
      </div>
    )
  }

  const allProjects = projects ?? []
  const filtered = allProjects.filter((p) => {
    if (statusFilter === 'active') return isActive(p)
    if (statusFilter === 'inactive') return !isActive(p)
    return true
  })
  const sorted = sortProjects(filtered, sortKey, sortDir)

  return (
    <section aria-labelledby="projects-heading">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 id="projects-heading" className="text-xl font-semibold">
          Proyectos
        </h2>
        <div className="flex items-center gap-2">
          <label id={filterLabelId} className="text-sm text-alten-body">
            Estado:
          </label>
          <select
            aria-labelledby={filterLabelId}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border border-alten-border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-alten-blue focus:outline-none"
          >
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-alten-mid text-sm py-4">No hay proyectos para mostrar.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-alten-border">
          <table
            role="table"
            className="min-w-full divide-y divide-alten-border text-sm"
          >
            <thead className="bg-alten-light">
              <tr>
                {COLUMNS.map(({ key, label }) => (
                  <th
                    key={key}
                    role="columnheader"
                    scope="col"
                    aria-sort={
                      sortKey === key
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    className="px-4 py-3 text-left font-medium text-alten-body whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(key)}
                      className="inline-flex items-center gap-1 hover:text-alten-body focus:outline-none focus-visible:ring-2 focus-visible:ring-alten-blue rounded"
                    >
                      {label}
                      {sortKey === key ? (
                        <span aria-hidden="true">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                      ) : (
                        <span aria-hidden="true" className="text-alten-border">
                          {' '}↕
                        </span>
                      )}
                    </button>
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-left font-medium text-alten-body">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-alten-body">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-alten-light">
              {sorted.map((project) => {
                const active = isActive(project)
                return (
                  <tr
                    key={project.id}
                    className={active ? '' : 'opacity-50 bg-alten-light'}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{project.code}</td>
                    <td className="px-4 py-3 font-medium text-alten-body">{project.name}</td>
                    <td className="px-4 py-3 text-alten-body">{project.client_name}</td>
                    <td className="px-4 py-3 text-alten-body">{project.start_date}</td>
                    <td className="px-4 py-3 text-alten-body">
                      {project.monthly_budget != null
                        ? `${Number(project.monthly_budget).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                          })} €`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          active
                            ? 'bg-alten-mid-blue text-alten-dark'
                            : 'bg-alten-light text-alten-mid'
                        }`}
                      >
                        {active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {onEdit && active && (
                        <button
                          type="button"
                          onClick={() => onEdit(project)}
                          className="text-alten-blue hover:text-alten-hover text-xs mr-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-alten-blue rounded"
                          aria-label={`Editar proyecto ${project.name}`}
                        >
                          Editar
                        </button>
                      )}
                      {active && (
                        <button
                          type="button"
                          onClick={() => handleDelete(project)}
                          disabled={deleteProject.isPending}
                          className="text-alten-red hover:text-alten-red text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-alten-red rounded disabled:opacity-50"
                          aria-label={`Eliminar proyecto ${project.name}`}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
