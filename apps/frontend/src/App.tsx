import { Routes, Route, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useAuth } from './lib/AuthContext.js'
import { useCurrentUser } from './lib/useCurrentUser.js'

const MasterDataPage = lazy(() => import('./routes/MasterDataPage.js'))
const BudgetsPage = lazy(() => import('./routes/BudgetsPage.js'))
const ConsultantPage = lazy(() => import('./routes/ConsultantPage.js'))
const ReportsPage = lazy(() => import('./routes/ReportsPage.js'))
const LoginPage = lazy(() => import('./routes/LoginPage.js'))
const RegisterPage = lazy(() => import('./routes/RegisterPage.js'))
const UserDashboard = lazy(() => import('./routes/UserDashboard.js'))
const ProfilePage = lazy(() => import('./routes/ProfilePage.js'))

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
  const { signOut, user } = useAuth()
  const { person, isAdmin } = useCurrentUser()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const showAdminLinks = isAdmin || !person
  // Fix: display name from session (user) not from person record, so it reflects the actual logged-in user
  const displayName = person?.full_name ?? user?.email ?? ''

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

      {/* User dropdown — shows actual session user, not hardcoded person record */}
      <div className="ml-auto relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          <span className="hidden sm:block max-w-[200px] truncate">{displayName}</span>
          <svg
            className="h-4 w-4 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1 w-52 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-50">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-500 truncate">{user?.email ?? ''}</p>
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={() => { navigate('/profile'); setDropdownOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Mi perfil
              </button>
              <button
                type="button"
                onClick={() => { void handleSignOut(); setDropdownOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
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
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
