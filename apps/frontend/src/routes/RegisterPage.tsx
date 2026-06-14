import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.js'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signUp(email, password, fullName)
      navigate('/')
    } catch {
      setError('No se ha podido completar el registro. Inténtelo de nuevo o contacte con soporte técnico.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F4F6F9' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <svg viewBox="0 0 110 32" className="h-8 w-auto mx-auto mb-4" fill="none" aria-label="ALTEN">
            <text x="0" y="26" fontFamily="'Inter','Segoe UI',Arial,sans-serif" fontSize="28" fontWeight="700" fill="#043962" letterSpacing="3">ALTEN</text>
          </svg>
        </div>

        <div className="bg-white rounded-xl border border-alten-border shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-8">
          <h1 className="text-[20px] font-bold text-alten-dark mb-1">Crear cuenta</h1>
          <p className="text-[13px] text-alten-mid mb-6">
            Rellene los datos para registrarse en el sistema.
          </p>

          {error && (
            <div role="alert" className="alert-error mb-5">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="register-name" className="block text-[13px] font-medium text-alten-body mb-1">
                Nombre completo
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                placeholder="Nombre y apellidos"
                className="field-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-[13px] font-medium text-alten-body mb-1">
                Correo electrónico
              </label>
              <input
                id="register-email"
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
              <label htmlFor="register-password" className="block text-[13px] font-medium text-alten-body mb-1">
                Contraseña
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
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
              {loading ? 'Registrando…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-alten-mid">
            ¿Ya dispone de cuenta?{' '}
            <Link to="/login" className="text-alten-blue font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
