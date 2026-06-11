import { useState } from 'react'
import { ProjectsTable } from '../features/master-data/components/ProjectsTable.js'
import { AssignmentForm } from '../features/master-data/components/AssignmentForm.js'
import { ProvidersPanel } from '../features/master-data/components/ProvidersPanel.js'
import { AccountsPanel } from '../features/master-data/components/AccountsPanel.js'
import type { Project } from '../features/master-data/types.js'

type Tab = 'projects' | 'assignments' | 'providers' | 'accounts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'projects', label: 'Proyectos' },
  { id: 'assignments', label: 'Asignaciones' },
  { id: 'providers', label: 'Proveedores' },
  { id: 'accounts', label: 'Cuentas IA' },
]

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<Tab>('projects')
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
      activeTab === tab
        ? 'border-blue-600 text-blue-700'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Datos Maestros</h1>

      <div role="tablist" aria-label="Secciones de datos maestros" className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`tab-panel-${id}`}
            id={`tab-${id}`}
            className={tabClass(id)}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="tab-panel-projects"
        aria-labelledby="tab-projects"
        hidden={activeTab !== 'projects'}
      >
        {editingProject ? (
          <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded">
            <p className="text-sm text-blue-700 mb-2">
              Editando: <strong>{editingProject.name}</strong>
            </p>
            <button
              type="button"
              className="text-xs text-blue-600 underline"
              onClick={() => setEditingProject(null)}
            >
              Cancelar edición
            </button>
          </div>
        ) : null}
        <ProjectsTable onEdit={setEditingProject} />
      </div>

      <div
        role="tabpanel"
        id="tab-panel-assignments"
        aria-labelledby="tab-assignments"
        hidden={activeTab !== 'assignments'}
      >
        <div className="max-w-lg">
          <AssignmentForm onSuccess={() => setActiveTab('projects')} />
        </div>
      </div>

      <div
        role="tabpanel"
        id="tab-panel-providers"
        aria-labelledby="tab-providers"
        hidden={activeTab !== 'providers'}
      >
        <ProvidersPanel />
      </div>

      <div
        role="tabpanel"
        id="tab-panel-accounts"
        aria-labelledby="tab-accounts"
        hidden={activeTab !== 'accounts'}
      >
        <AccountsPanel />
      </div>
    </div>
  )
}
