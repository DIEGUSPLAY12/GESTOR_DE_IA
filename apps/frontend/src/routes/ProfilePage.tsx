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
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Botón de retroceso */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="back-btn"
        style={{ marginBottom: 20 }}
      >
        <svg style={{ width: 14, height: 14, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver
      </button>

      <h1 className="type-page-title" style={{ marginBottom: 28 }}>Mi Perfil</h1>

      {/* Sección: Información personal */}
      <section className="bg-white rounded-lg border border-alten-border" style={{ padding: '24px 28px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <h2
          className="type-section-title"
          style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E6E6E9' }}
        >
          Información personal
        </h2>

        {/* Correo — solo lectura con más peso */}
        <div style={{ marginBottom: 20 }}>
          <p className="type-form-label" style={{ marginBottom: 6 }}>Correo electrónico</p>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#043962' }}>
            {user?.email?.toLowerCase()}
          </p>
        </div>

        {nameSuccess && (
          <div role="status" className="alert-success" style={{ marginBottom: 16 }}>
            Nombre actualizado correctamente.
          </div>
        )}
        {nameError && (
          <div role="alert" className="alert-error" style={{ marginBottom: 16 }}>
            {nameError}
          </div>
        )}

        <form onSubmit={handleNameSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label htmlFor="profile-name" className="type-form-label block" style={{ marginBottom: 6 }}>
              Nombre completo
            </label>
            <input
              id="profile-name"
              type="text"
              autoComplete="name"
              required
              className="field-input"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setNameSuccess(false) }}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={nameSaving || !fullName.trim() || !person}
              className="btn-primary"
            >
              {nameSaving ? 'Guardando…' : 'Guardar nombre'}
            </button>
          </div>
        </form>
      </section>

      {/* Sección: Cambiar contraseña */}
      <section className="bg-white rounded-lg border border-alten-border" style={{ padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <h2
          className="type-section-title"
          style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E6E6E9' }}
        >
          Cambiar contraseña
        </h2>

        {passwordSuccess && (
          <div role="status" className="alert-success" style={{ marginBottom: 16 }}>
            Contraseña actualizada correctamente.
          </div>
        )}
        {passwordError && (
          <div role="alert" className="alert-error" style={{ marginBottom: 16 }}>
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label htmlFor="current-password" className="type-form-label block" style={{ marginBottom: 6 }}>
              Contraseña actual
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              className="field-input"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordSuccess(false) }}
            />
          </div>
          <div>
            <label htmlFor="new-password" className="type-form-label block" style={{ marginBottom: 6 }}>
              Nueva contraseña
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="field-input"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordSuccess(false) }}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="type-form-label block" style={{ marginBottom: 6 }}>
              Confirmar nueva contraseña
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="field-input"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordSuccess(false) }}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              className="btn-primary"
            >
              {passwordSaving ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
