import { useState } from 'react'
import { JoinProjectSection } from '../features/master-data/components/JoinProjectSection.js'
import { MyToolsSection } from '../features/master-data/components/MyToolsSection.js'
import { UsageHistory } from '../features/usage/components/UsageHistory.js'
import { useCurrentUser } from '../lib/useCurrentUser.js'

type Tab = 'proyectos' | 'herramientas' | 'historial'

function formatDateFormal(date: Date): string {
  const raw = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  // Capitalizar solo la primera letra; el resto en minúsculas
  // Corrije comportamientos de navegador como "Domingo, 14 De Junio De 2026"
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
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
          {/* Saludo con nombre destacado */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 40, height: 40, background: '#008BD2', fontSize: 14, fontWeight: 700, color: '#fff' }}
            >
              {person?.full_name
                ? person.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                : '?'}
            </div>
            <div>
              <p style={{ fontSize: 13, color: '#8C8C9A', lineHeight: 1.3 }}>Bienvenido,</p>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#043962', lineHeight: 1.3 }}>
                {person?.full_name ?? '—'}
              </p>
            </div>
          </div>
          <h1 className="type-page-title">Mi Área de Trabajo</h1>
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

      {/* Tabs */}
      <div role="tablist" aria-label="Secciones de mi área" className="flex border-b border-alten-border mb-6" style={{ gap: 4 }}>
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
        <p style={{ fontSize: 14, color: '#8C8C9A', marginBottom: 20 }}>
          Proyectos en los que participa su cuenta. Puede registrar el uso de herramientas
          de IA en cada proyecto activo.
        </p>
        {person
          ? <JoinProjectSection personId={person.id} />
          : <p style={{ fontSize: 14, color: '#8C8C9A' }}>Cargando información de proyectos…</p>
        }
      </div>

      {/* Panel: Herramientas */}
      <div role="tabpanel" id="panel-herramientas" hidden={activeTab !== 'herramientas'}>
        <p style={{ fontSize: 14, color: '#8C8C9A', marginBottom: 20 }}>
          Gestione las herramientas de IA asociadas a su cuenta. Las herramientas añadidas
          estarán disponibles al registrar uso en proyectos.
        </p>
        <MyToolsSection />
      </div>

      {/* Panel: Historial */}
      <div role="tabpanel" id="panel-historial" hidden={activeTab !== 'historial'}>
        <p style={{ fontSize: 14, color: '#8C8C9A', marginBottom: 20 }}>
          Registro histórico del uso de herramientas de IA imputado a proyectos.
        </p>
        <UsageHistory periodMonth={periodMonth} />
      </div>
    </div>
  )
}
