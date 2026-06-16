import { useState, useId } from 'react'
import { useAccountOwners, useAssignOwner, usePersons } from '../api/hooks.js'

interface Props {
  accountId: string
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function OwnershipForm({ accountId }: Props) {
  const formId = useId()
  const { data: ownerships, isLoading: loadingOwners } = useAccountOwners(accountId)
  const { data: people } = usePersons()
  const assignOwner = useAssignOwner()

  const [email, setEmail] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeOwnerships = (ownerships ?? []).filter(
    (o) => o.valid_to === null || o.valid_to >= today(),
  )

  function resetForm() {
    setEmail('')
    setError(null)
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    const person = (people ?? []).find(
      (p) => p.email.toLowerCase() === normalizedEmail && p.deleted_at === null,
    )

    if (!person) {
      setError(`No se encontró ningún usuario con el email "${normalizedEmail}". Asegúrate de que esté registrado en el sistema.`)
      return
    }

    const alreadyAssigned = activeOwnerships.some((o) => o.person_id === person.id)
    if (alreadyAssigned) {
      setError(`${person.full_name} ya está asignado a esta cuenta.`)
      return
    }

    try {
      await assignOwner.mutateAsync({
        accountId,
        person_id: person.id,
        percentage: 100,
        valid_from: today(),
      })
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el usuario')
    }
  }

  const fc = 'w-full border border-alten-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-alten-blue focus:outline-none'

  return (
    <div className="mt-3 pl-4 border-l-2 border-alten-light">
      <h4 className="text-xs font-semibold text-alten-mid uppercase tracking-wide mb-2">Usuarios</h4>

      {loadingOwners && (
        <p className="text-xs text-alten-mid py-1">Cargando usuarios…</p>
      )}

      {!loadingOwners && activeOwnerships.length === 0 && (
        <p className="text-xs text-alten-mid py-1">Sin usuarios asignados.</p>
      )}

      {!loadingOwners && activeOwnerships.length > 0 && (
        <table className="min-w-full text-xs mb-3">
          <thead>
            <tr className="text-alten-mid">
              <th scope="col" className="text-left pr-4 py-1 font-medium">Nombre</th>
              <th scope="col" className="text-left py-1 font-medium">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activeOwnerships.map((o) => (
              <tr key={o.id}>
                <td className="pr-4 py-1.5 text-alten-body">
                  {o.person?.full_name ?? (
                    <span className="font-mono text-alten-mid">{o.person_id.slice(0, 8)}…</span>
                  )}
                </td>
                <td className="py-1.5 text-alten-mid">{o.person?.email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-xs text-alten-blue hover:text-alten-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-alten-blue rounded"
        >
          + Añadir usuario
        </button>
      ) : (
        <form
          id={`${formId}-ownership`}
          onSubmit={handleSubmit}
          className="mt-2 space-y-2 max-w-sm bg-alten-light border border-alten-border rounded p-3"
        >
          <div>
            <label htmlFor={`${formId}-email`} className="block text-xs font-medium text-alten-body mb-0.5">
              Email del usuario *
            </label>
            <input
              id={`${formId}-email`}
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              placeholder="usuario@alten.es"
              className={fc}
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-alten-red">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={assignOwner.isPending}
              className="px-3 py-1 text-xs font-medium text-white bg-alten-blue rounded hover:bg-alten-hover disabled:opacity-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-alten-blue"
            >
              {assignOwner.isPending ? 'Guardando…' : 'Añadir usuario'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1 text-xs text-alten-mid border border-alten-border rounded hover:bg-alten-light focus:outline-none focus-visible:ring-1 focus-visible:ring-alten-border"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
