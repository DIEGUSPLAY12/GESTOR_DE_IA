import { Routes, Route, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { useAuth } from './lib/AuthContext.js'
import { useCurrentUser } from './lib/useCurrentUser.js'

const MasterDataPage = lazy(() => import('./routes/MasterDataPage.js'))
const BudgetsPage = lazy(() => import('./routes/BudgetsPage.js'))
const ConsultantPage = lazy(() => import('./routes/ConsultantPage.js'))
const ReportsPage = lazy(() => import('./routes/ReportsPage.js'))
const LoginPage = lazy(() => import('./routes/LoginPage.js'))
const RegisterPage = lazy(() => import('./routes/RegisterPage.js'))
const UserDashboard = lazy(() => import('./routes/UserDashboard.js'))

function LoadingFallback() {
  return (
    <div role="status" aria-live="polite" className="p-8 text-center text-gray-500">
      Cargando…
    </div>
  )
}

function ProtectedRoute() {
  const { session, isInitialized } = useAuth()

  if (!isInitialized) return <LoadingFallback />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function NavBar() {
  const { signOut } = useAuth()
  const { person, isAdmin } = useCurrentUser()
  const navigate = useNavigate()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-700 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const showAdminLinks = isAdmin || !person

  return (
    <nav
      aria-label="Navegación principal"
      className="bg-gray-800 px-4 py-3 flex gap-2 items-center"
    >
      <span className="text-white font-semibold mr-4">Gestor de IA</span>

      {showAdminLinks && (
        <NavLink to="/master-data" className={linkClass}>
          Datos maestros
        </NavLink>
      )}

      <NavLink to="/budgets" className={linkClass}>
        Presupuestos
      </NavLink>

      <NavLink to="/consultant" className={linkClass}>
        Mi consumo
      </NavLink>

      {showAdminLinks && (
        <NavLink to="/reports" className={linkClass}>
          Informes
        </NavLink>
      )}

      {!isAdmin && person && (
        <NavLink to="/dashboard" className={linkClass}>
          Mi área
        </NavLink>
      )}

      <div className="ml-auto flex items-center gap-3">
        {person && (
          <span className="text-sm text-gray-400 hidden sm:block">{person.email}</span>
        )}
        <button
          type="button"
          onClick={() => { void handleSignOut() }}
          className="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main id="main-content" className="mx-auto max-w-7xl p-6">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<BudgetsPage />} />
            <Route path="/master-data/*" element={<MasterDataPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/consultant" element={<ConsultantPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/dashboard" element={<UserDashboard />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
