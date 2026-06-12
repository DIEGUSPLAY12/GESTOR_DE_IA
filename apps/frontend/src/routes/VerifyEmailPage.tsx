import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.js'

export default function VerifyEmailPage() {
  const { verifyOtp, resendVerification } = useAuth()
  const navigate = useNavigate()
  const [email] = useState(() => sessionStorage.getItem('pending_verification_email') ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    if (!email) navigate('/register', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setError(null)
    setLoading(true)
    try {
      await verifyOtp(email, code)
      sessionStorage.removeItem('pending_verification_email')
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto. Inténtalo de nuevo.')
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResendLoading(true)
    setError(null)
    try {
      await resendVerification(email)
      setResendCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el código')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Verifica tu correo</h1>
        <p className="text-sm text-gray-500 mb-1 text-center">
          Hemos enviado un código de 6 dígitos a
        </p>
        <p className="text-sm font-medium text-gray-900 mb-6 text-center truncate">{email}</p>

        {error && (
          <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700 mb-1">
              Código de verificación
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              required
              className="block w-full rounded border border-gray-300 px-3 py-2 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Verificando…' : 'Verificar cuenta'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            disabled={resendCooldown > 0 || resendLoading}
            onClick={() => { void handleResend() }}
            className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendLoading
              ? 'Enviando…'
              : resendCooldown > 0
                ? `Reenviar en ${resendCooldown}s`
                : 'Reenviar código'}
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-gray-400">
          El código caduca en 15 minutos.
        </p>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link to="/login" className="text-blue-600 hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
