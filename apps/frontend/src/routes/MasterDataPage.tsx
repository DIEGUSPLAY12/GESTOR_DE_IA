import { useState } from 'react'
import { ProjectsTable } from '../features/master-data/components/ProjectsTable.js'
import { ProjectForm } from '../features/master-data/components/ProjectForm.js'
import { ProvidersPanel } from '../features/master-data/components/ProvidersPanel.js'
import { AccountsPanel } from '../features/master-data/components/AccountsPanel.js'
import type { Project } from '../features/master-data/types.js'

type Tab = 'projects' | 'providers' | 'accounts'
type ProjectMode = 'list' | 'create' | 'edit'

const TABS: { id: Tab; label: string }[] = [
  { id: 'projects', label: 'Proyectos' },
  { id: 'providers', label: 'Proveedores' },
  { id: 'accounts', label: 'Cuentas IA' },
]

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<Tab>('projects')
  const [projectMode, setProjectMode] = useState<ProjectMode>('list')
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
      activeTab === tab
        ? 'border-blue-600 text-blue-700'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  function handleEdit(project: Project) {
    setEditingProject(project)
    setProjectMode('edit')
  }

  function handleBackToList() {
    setProjectMode('list')
    setEditingProject(null)
  }

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
            onClick={() => { setActiveTab(id); handleBackToList() }}
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
        {projectMode === 'list' ? (
          <>
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => setProjectMode('create')}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Nuevo proyecto
              </button>
            </div>
            <ProjectsTable onEdit={handleEdit} />
          </>
        ) : (
          <div className="max-w-2xl">
            <ProjectForm
              {...(projectMode === 'edit' && editingProject ? { project: editingProject } : {})}
              onSuccess={handleBackToList}
              onCancel={handleBackToList}
            />
          </div>
        )}
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
