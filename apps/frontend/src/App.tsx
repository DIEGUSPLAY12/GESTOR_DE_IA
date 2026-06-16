import { Routes, Route, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useAuth } from './lib/AuthContext.js'
import { useCurrentUser } from './lib/useCurrentUser.js'

const MasterDataPage    = lazy(() => import('./routes/MasterDataPage.js'))
const BudgetsPage       = lazy(() => import('./routes/BudgetsPage.js'))
const ConsultantPage    = lazy(() => import('./routes/ConsultantPage.js'))
const ReportsPage       = lazy(() => import('./routes/ReportsPage.js'))
const LoginPage         = lazy(() => import('./routes/LoginPage.js'))
const RegisterPage      = lazy(() => import('./routes/RegisterPage.js'))
const UserDashboard     = lazy(() => import('./routes/UserDashboard.js'))
const ProfilePage       = lazy(() => import('./routes/ProfilePage.js'))
const ProjectDetailPage = lazy(() => import('./routes/ProjectDetailPage.js'))

function LoadingFallback() {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center p-12 text-alten-mid text-sm">
      Cargando…
    </div>
  )
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

function ProtectedRoute() {
  const { session, isInitialized } = useAuth()
  if (!isInitialized) return <LoadingFallback />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

// ─── Admin-only guard: redirects standard users to /dashboard with message ───

function RequireAdmin() {
  const { isAdmin, isLoading } = useCurrentUser()
  if (isLoading) return <LoadingFallback />
  if (!isAdmin) return <Navigate to="/dashboard" state={{ accessDenied: true }} replace />
  return <Outlet />
}

// ─── Index redirect based on role ────────────────────────────────────────────

function RoleBasedIndex() {
  const { isAdmin, person, isLoading } = useCurrentUser()
  if (isLoading) return <LoadingFallback />
  if (isAdmin) return <Navigate to="/budgets" replace />
  if (person) return <Navigate to="/dashboard" replace />
  // Fallback while person record loads
  return <Navigate to="/dashboard" replace />
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const icons = {
  masterData: (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  ),
  budgets: (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  reports: (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  myProjects: (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v.75A2.25 2.25 0 0 1 19.5 17.25h-15A2.25 2.25 0 0 1 2.25 15.75V15" />
    </svg>
  ),
}

// ─── Header (64px fijo) ───────────────────────────────────────────────────────

function Header() {
  const { signOut, user } = useAuth()
  const { person } = useCurrentUser()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const displayName = person?.full_name ?? user?.email ?? ''
  const initials = displayName ? getInitials(displayName) : '?'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 bg-alten-dark border-b-[3px] border-alten-blue"
      style={{ height: 64, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
    >
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 118 30" className="h-6 w-auto" fill="none" aria-label="ALTEN">
          <text x="0" y="24" fontFamily="'Inter','Segoe UI',Arial,sans-serif" fontSize="26" fontWeight="800" fill="#FFFFFF" letterSpacing="1">ALTEN</text>
        </svg>
        <span className="hidden md:block text-[11px] font-medium tracking-[1.5px] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
          España
        </span>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-full pl-2 pr-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          <span
            className="flex items-center justify-center rounded-full flex-shrink-0 font-bold text-white"
            style={{ width: 36, height: 36, fontSize: 13, backgroundColor: '#008BD2' }}
          >
            {initials}
          </span>
          <span className="hidden sm:block max-w-[180px] truncate" style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>{displayName}</span>
          <svg className="h-3.5 w-3.5 flex-shrink-0 text-white/50" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] ring-1 ring-alten-border z-50 overflow-hidden">
            <div className="px-4 py-3 bg-alten-surface border-b border-alten-border">
              <p className="text-xs font-semibold text-alten-dark truncate">{displayName}</p>
              <p className="text-[11px] text-alten-mid truncate mt-0.5">{user?.email ?? ''}</p>
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={() => { navigate('/profile'); setDropdownOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-alten-body hover:bg-alten-surface transition-colors duration-200"
              >
                Mi perfil
              </button>
              <div className="border-t border-alten-border" />
              <button
                type="button"
                onClick={() => { void handleSignOut(); setDropdownOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-alten-red hover:bg-red-50 transition-colors duration-200"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  function itemClass({ isActive }: { isActive: boolean }) {
    return isActive ? 'sidebar-item-active' : 'sidebar-item'
  }

  return (
    <aside
      className="fixed left-0 bottom-0 z-30 flex flex-col bg-alten-dark overflow-y-auto"
      style={{ top: 64, width: 240 }}
      aria-label="Navegación principal"
    >
      <nav className="flex-1 px-3 py-5">
        <p className="px-5 mb-2" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
          Navegación
        </p>

        <div className="space-y-1">
          {isAdmin ? (
            <>
              <NavLink to="/master-data" className={itemClass}>
                {icons.masterData}
                <span>Datos maestros</span>
              </NavLink>
              <NavLink to="/budgets" className={itemClass}>
                {icons.budgets}
                <span>Presupuestos</span>
              </NavLink>
              <NavLink to="/reports" className={itemClass}>
                {icons.reports}
                <span>Informes</span>
              </NavLink>
            </>
          ) : (
            <NavLink to="/dashboard" className={itemClass}>
              {icons.myProjects}
              <span>Mis Proyectos</span>
            </NavLink>
          )}
        </div>
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.3px' }}>
          Gestor de IA — ALTEN España
        </p>
      </div>
    </aside>
  )
}

// ─── Layout principal ─────────────────────────────────────────────────────────

function AppLayout() {
  const { person, isAdmin } = useCurrentUser()

  return (
    <div className="min-h-screen bg-alten-surface">
      <Header />
      <Sidebar isAdmin={isAdmin} />
      <main
        id="main-content"
        className="min-h-screen"
        style={{ marginLeft: 240, paddingTop: 64 }}
      >
        <div className="p-6 max-w-[1200px]">
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Role-based index */}
            <Route index element={<RoleBasedIndex />} />

            {/* Standard user routes */}
            <Route path="/dashboard"            element={<UserDashboard />} />
            <Route path="/projects/:projectId"  element={<ProjectDetailPage />} />
            <Route path="/profile"              element={<ProfilePage />} />

            {/* Admin-only routes */}
            <Route element={<RequireAdmin />}>
              <Route path="/master-data/*" element={<MasterDataPage />} />
              <Route path="/budgets"       element={<BudgetsPage />} />
              <Route path="/reports"       element={<ReportsPage />} />
              <Route path="/consultant"    element={<ConsultantPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
