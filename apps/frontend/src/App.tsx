import { Routes, Route, NavLink } from 'react-router-dom'
import { Suspense, lazy } from 'react'

const MasterDataPage = lazy(() => import('./routes/MasterDataPage.js'))
const BudgetsPage = lazy(() => import('./routes/BudgetsPage.js'))
const ConsultantPage = lazy(() => import('./routes/ConsultantPage.js'))
const ReportsPage = lazy(() => import('./routes/ReportsPage.js'))

function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-700 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`

  return (
    <nav
      aria-label="Navegación principal"
      className="bg-gray-800 px-4 py-3 flex gap-2 items-center"
    >
      <span className="text-white font-semibold mr-4">Gestor de IA</span>
      <NavLink to="/master-data" className={linkClass}>
        Datos maestros
      </NavLink>
      <NavLink to="/budgets" className={linkClass}>
        Presupuestos
      </NavLink>
      <NavLink to="/consultant" className={linkClass}>
        Mi consumo
      </NavLink>
      <NavLink to="/reports" className={linkClass}>
        Informes
      </NavLink>
    </nav>
  )
}

function LoadingFallback() {
  return (
    <div role="status" aria-live="polite" className="p-8 text-center text-gray-500">
      Cargando…
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main id="main-content" className="mx-auto max-w-7xl p-6">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<BudgetsPage />} />
            <Route path="/master-data/*" element={<MasterDataPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/consultant" element={<ConsultantPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
