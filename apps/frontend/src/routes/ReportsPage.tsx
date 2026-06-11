import { useState } from 'react'
import { ExportPanel } from '../features/reports/components/ExportPanel.js'
import { ImputationPanel } from '../features/imputation/components/ImputationPanel.js'
import { ConsumptionImport } from '../features/imputation/components/ConsumptionImport.js'

type Tab = 'export' | 'calculate' | 'import'

const TABS: { id: Tab; label: string }[] = [
  { id: 'export', label: 'Exportar CSV' },
  { id: 'calculate', label: 'Calcular imputaciones' },
  { id: 'import', label: 'Importar consumos' },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('export')

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
      activeTab === tab
        ? 'border-blue-600 text-blue-700'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Informes y Operaciones</h1>

      <div
        role="tablist"
        aria-label="Secciones de informes"
        className="flex gap-1 border-b border-gray-200 mb-6"
      >
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
        id="tab-panel-export"
        aria-labelledby="tab-export"
        hidden={activeTab !== 'export'}
      >
        <ExportPanel />
      </div>

      <div
        role="tabpanel"
        id="tab-panel-calculate"
        aria-labelledby="tab-calculate"
        hidden={activeTab !== 'calculate'}
      >
        <ImputationPanel />
      </div>

      <div
        role="tabpanel"
        id="tab-panel-import"
        aria-labelledby="tab-import"
        hidden={activeTab !== 'import'}
      >
        <ConsumptionImport />
      </div>
    </div>
  )
}
