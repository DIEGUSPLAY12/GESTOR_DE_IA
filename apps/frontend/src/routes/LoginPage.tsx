import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.js'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch {
      setError('No se ha podido iniciar sesión. Verifique sus credenciales e inténtelo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F4F6F9' }}>
      {/* Panel izquierdo — identidad ALTEN */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 px-12 py-10"
        style={{ backgroundColor: '#043962' }}
      >
        <div>
          {/* Logo */}
          <svg viewBox="0 0 110 32" className="h-8 w-auto mb-12" fill="none" aria-label="ALTEN">
            <text x="0" y="26" fontFamily="'Inter','Segoe UI',Arial,sans-serif" fontSize="28" fontWeight="700" fill="#FFFFFF" letterSpacing="3">ALTEN</text>
          </svg>
          <h2 className="text-[22px] font-bold text-white leading-snug mb-3">
            Gestor de IA
          </h2>
          <p className="text-[14px] text-white/60 leading-relaxed">
            Plataforma interna para la gestión del uso de herramientas
            de inteligencia artificial en proyectos de ALTEN España.
          </p>
        </div>
        <p className="text-[11px] text-white/30">
          © {new Date().getFullYear()} ALTEN España — Uso interno exclusivo
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <div className="lg:hidden mb-8 text-center">
            <svg viewBox="0 0 110 32" className="h-8 w-auto mx-auto" fill="none" aria-label="ALTEN">
              <text x="0" y="26" fontFamily="'Inter','Segoe UI',Arial,sans-serif" fontSize="28" fontWeight="700" fill="#043962" letterSpacing="3">ALTEN</text>
            </svg>
          </div>

          <h1 className="text-[22px] font-bold text-alten-dark mb-1">Iniciar sesión</h1>
          <p className="text-[14px] text-alten-mid mb-7">
            Introduzca sus credenciales corporativas para acceder.
          </p>

          {error && (
            <div role="alert" className="alert-error mb-5">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-[13px] font-medium text-alten-body mb-1">
                Correo electrónico corporativo
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                placeholder="usuario@alten.es"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[13px] font-medium text-alten-body mb-1">
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5"
            >
              {loading ? 'Verificando credenciales…' : 'Acceder'}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-alten-mid">
            ¿No dispone de cuenta?{' '}
            <Link to="/register" className="text-alten-blue font-medium hover:underline">
              Solicitar acceso
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
