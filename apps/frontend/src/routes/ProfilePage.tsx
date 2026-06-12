import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/AuthContext.js'
import { useCurrentUser } from '../lib/useCurrentUser.js'
import { useUpdatePerson } from '../features/master-data/api/hooks.js'
import { supabase } from '../lib/supabase.js'

export default function ProfilePage() {
  const { user } = useAuth()
  const { person } = useCurrentUser()
  const updatePerson = useUpdatePerson()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSaving, setNameSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Populate name field once person data loads
  useEffect(() => {
    if (person?.full_name) setFullName(person.full_name)
  }, [person?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault()
    if (!person) return
    const trimmed = fullName.trim()
    if (!trimmed) return
    setNameError(null)
    setNameSuccess(false)
    setNameSaving(true)
    try {
      await updatePerson.mutateAsync({ id: person.id, full_name: trimmed })
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      setNameSuccess(true)
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Error al guardar el nombre')
    } finally {
      setNameSaving(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    const email = user?.email
    if (!email) {
      setPasswordError('No se pudo identificar el correo del usuario')
      return
    }

    setPasswordSaving(true)
    try {
      // Verify current password before updating
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
      if (authError) {
        setPasswordError('La contraseña actual es incorrecta')
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar la contraseña')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Volver
        </button>
        <h1 className="text-xl font-bold text-gray-900">Mi perfil</h1>
      </div>

      {/* Personal info section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Información personal</h2>

        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Correo electrónico</p>
          <p className="text-sm text-gray-900">{user?.email}</p>
        </div>

        {nameSuccess && (
          <div role="status" className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Nombre actualizado correctamente.
          </div>
        )}
        {nameError && (
          <div role="alert" className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {nameError}
          </div>
        )}

        <form onSubmit={handleNameSubmit} noValidate className="space-y-3">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              id="profile-name"
              type="text"
              autoComplete="name"
              required
              className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setNameSuccess(false) }}
            />
          </div>
          <button
            type="submit"
            disabled={nameSaving || !fullName.trim() || !person}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nameSaving ? 'Guardando…' : 'Guardar nombre'}
          </button>
        </form>
      </section>

      {/* Password section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Cambiar contraseña</h2>

        {passwordSuccess && (
          <div role="status" className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Contraseña actualizada correctamente.
          </div>
        )}
        {passwordError && (
          <div role="alert" className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} noValidate className="space-y-3">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña actual
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordSuccess(false) }}
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordSuccess(false) }}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordSuccess(false) }}
            />
          </div>
          <button
            type="submit"
            disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordSaving ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>
    </div>
  )
}
