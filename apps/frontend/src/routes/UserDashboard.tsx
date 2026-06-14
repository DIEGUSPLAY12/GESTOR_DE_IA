import { useState } from 'react'
import { JoinProjectSection } from '../features/master-data/components/JoinProjectSection.js'
import { MyToolsSection } from '../features/master-data/components/MyToolsSection.js'
import { UsageHistory } from '../features/usage/components/UsageHistory.js'
import { useCurrentUser } from '../lib/useCurrentUser.js'

type Tab = 'proyectos' | 'herramientas' | 'historial'

function formatDateFormal(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function UserDashboard() {
  const { person } = useCurrentUser()
  const today = new Date().toISOString().slice(0, 7)
  const [activeTab, setActiveTab] = useState<Tab>('proyectos')
  const [periodMonth] = useState(today)

  const tabClass = (tab: Tab) =>
    `tab-btn ${activeTab === tab ? 'tab-btn-active' : 'tab-btn-inactive'}`

  return (
    <div>
      {/* Cabecera de sección */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-alten-dark">Mi Área de Trabajo</h1>
          <p className="text-[14px] text-alten-mid mt-1">
            Bienvenido/a, <span className="font-medium text-alten-body">{person?.full_name ?? '—'}</span>
            {' '}— ALTEN España
          </p>
        </div>
        <p className="text-[13px] text-alten-mid text-right capitalize hidden sm:block mt-1">
          {formatDateFormal(new Date())}
        </p>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Secciones de mi área" className="flex gap-0.5 border-b border-alten-border mb-6">
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
          Herramientas de IA
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

      {/* Panel: Proyectos */}
      <div role="tabpanel" id="panel-proyectos" hidden={activeTab !== 'proyectos'}>
        <p className="text-[14px] text-alten-mid mb-5">
          Proyectos en los que participa su cuenta. Puede registrar el uso de herramientas de IA
          en cada proyecto activo.
        </p>
        {person
          ? <JoinProjectSection personId={person.id} />
          : <p className="text-sm text-alten-mid">Cargando información de proyectos…</p>
        }
      </div>

      {/* Panel: Herramientas */}
      <div role="tabpanel" id="panel-herramientas" hidden={activeTab !== 'herramientas'}>
        <p className="text-[14px] text-alten-mid mb-5">
          Gestione las herramientas de IA asociadas a su cuenta. Las herramientas añadidas
          estarán disponibles al registrar uso en proyectos.
        </p>
        <MyToolsSection />
      </div>

      {/* Panel: Historial */}
      <div role="tabpanel" id="panel-historial" hidden={activeTab !== 'historial'}>
        <p className="text-[14px] text-alten-mid mb-5">
          Registro histórico del uso de herramientas de IA imputado a proyectos.
        </p>
        <UsageHistory periodMonth={periodMonth} />
      </div>
    </div>
  )
}
