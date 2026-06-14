import { useState } from 'react'
import { JoinProjectSection } from '../features/master-data/components/JoinProjectSection.js'
import { MyToolsSection } from '../features/master-data/components/MyToolsSection.js'
import { UsageHistory } from '../features/usage/components/UsageHistory.js'
import { useCurrentUser } from '../lib/useCurrentUser.js'

type Tab = 'proyectos' | 'herramientas' | 'historial'

export default function UserDashboard() {
  const { person } = useCurrentUser()
  const today = new Date().toISOString().slice(0, 7)
  const [activeTab, setActiveTab] = useState<Tab>('proyectos')
  const [periodMonth] = useState(today)

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
      activeTab === tab
        ? 'border-blue-600 text-blue-700'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Mi área{person ? ` — ${person.full_name}` : ''}
        </h1>
        <p className="text-sm text-gray-500">Gestiona tus proyectos, herramientas de IA y registra tu actividad</p>
      </div>

      <div role="tablist" aria-label="Secciones de mi área" className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          role="tab"
          aria-selected={activeTab === 'proyectos'}
          aria-controls="panel-proyectos"
          className={tabClass('proyectos')}
          onClick={() => setActiveTab('proyectos')}
        >
          Proyectos
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'herramientas'}
          aria-controls="panel-herramientas"
          className={tabClass('herramientas')}
          onClick={() => setActiveTab('herramientas')}
        >
          Mis herramientas de IA
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'historial'}
          aria-controls="panel-historial"
          className={tabClass('historial')}
          onClick={() => setActiveTab('historial')}
        >
          Historial de uso
        </button>
      </div>

      {/* Proyectos */}
      <div role="tabpanel" id="panel-proyectos" hidden={activeTab !== 'proyectos'}>
        <p className="text-sm text-gray-500 mb-4">
          Únete a los proyectos en los que participas. En cada proyecto que hayas unido puedes registrar el uso de tus herramientas de IA.
        </p>
        {person
          ? <JoinProjectSection personId={person.id} />
          : <p className="text-sm text-gray-400">Cargando…</p>
        }
      </div>

      {/* Mis herramientas */}
      <div role="tabpanel" id="panel-herramientas" hidden={activeTab !== 'herramientas'}>
        <MyToolsSection />
      </div>

      {/* Historial */}
      <div role="tabpanel" id="panel-historial" hidden={activeTab !== 'historial'}>
        <p className="text-sm text-gray-500 mb-4">Registro de todo el uso de IA que has imputado a proyectos.</p>
        <UsageHistory periodMonth={periodMonth} />
      </div>
    </div>
  )
}
