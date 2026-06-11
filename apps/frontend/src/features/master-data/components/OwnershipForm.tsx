import { useState, useId } from 'react'
import { useAccountOwners, useAssignOwner, usePersons } from '../api/hooks.js'

interface Props {
  accountId: string
}

export function OwnershipForm({ accountId }: Props) {
  const formId = useId()
  const { data: ownerships, isLoading: loadingOwners } = useAccountOwners(accountId)
  const { data: people, isLoading: loadingPeople } = usePersons()
  const assignOwner = useAssignOwner()

  const [personId, setPersonId] = useState('')
  const [percentage, setPercentage] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const activeOwnerships = (ownerships ?? []).filter((o) => o.valid_to === null || o.valid_to >= new Date().toISOString().slice(0, 10))

  const currentTotal = activeOwnerships.reduce((sum, o) => sum + Number(o.percentage), 0)

  function handlePercentageChange(value: string) {
    setPercentage(value)
    setWarning(null)
    const pct = Number(value)
    if (!isNaN(pct) && pct > 0) {
      const projected = currentTotal + pct
      if (projected > 100) {
        setWarning(`La suma total llegaría a ${projected.toFixed(2)}%, superando el 100%.`)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const pct = Number(percentage)
    if (currentTotal + pct > 100) {
      setError(`No se puede asignar ${pct}%: la suma total superaría el 100% (actual: ${currentTotal.toFixed(2)}%).`)
      return
    }

    try {
      await assignOwner.mutateAsync({
        accountId,
        person_id: personId,
        percentage: pct,
        valid_from: validFrom,
        ...(validTo ? { valid_to: validTo } : {}),
      })
      setPersonId('')
      setPercentage('')
      setValidFrom('')
      setValidTo('')
      setWarning(null)
      setShowForm(false)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error al guardar la titularidad')
      }
    }
  }

  const activePeople = (people ?? []).filter((p) => p.deleted_at === null)

  return (
    <div className="mt-3 pl-4 border-l-2 border-gray-100">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Titulares</h4>

      {loadingOwners && (
        <p className="text-xs text-gray-400 py-1">Cargando titulares…</p>
      )}

      {!loadingOwners && activeOwnerships.length === 0 && (
        <p className="text-xs text-gray-400 py-1">Sin titulares asignados.</p>
      )}

      {!loadingOwners && activeOwnerships.length > 0 && (
        <table className="min-w-full text-xs mb-3">
          <thead>
            <tr className="text-gray-400">
              <th scope="col" className="text-left pr-4 py-1 font-medium">Persona</th>
              <th scope="col" className="text-right pr-4 py-1 font-medium">%</th>
              <th scope="col" className="text-left pr-4 py-1 font-medium">Desde</th>
              <th scope="col" className="text-left py-1 font-medium">Hasta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activeOwnerships.map((o) => (
              <tr key={o.id}>
                <td className="pr-4 py-1.5 text-gray-800">
                  {o.person ? (
                    <span title={o.person.email}>{o.person.full_name}</span>
                  ) : (
                    <span className="font-mono text-gray-400">{o.person_id.slice(0, 8)}…</span>
                  )}
                </td>
                <td className="pr-4 py-1.5 text-right font-medium text-gray-700">
                  {Number(o.percentage).toFixed(2)}%
                </td>
                <td className="pr-4 py-1.5 text-gray-500">{o.valid_from}</td>
                <td className="py-1.5 text-gray-500">
                  {o.valid_to ?? <span className="text-gray-400">vigente</span>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td className="pr-4 py-1.5 text-xs text-gray-500 font-medium">Total activo</td>
              <td
                className={`pr-4 py-1.5 text-right text-xs font-bold ${
                  currentTotal > 100 ? 'text-red-600' : currentTotal >= 90 ? 'text-amber-600' : 'text-gray-700'
                }`}
              >
                {currentTotal.toFixed(2)}%
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 rounded"
        >
          + Añadir titular
        </button>
      ) : (
        <form
          id={`${formId}-ownership`}
          onSubmit={handleSubmit}
          className="mt-2 space-y-2 max-w-lg bg-gray-50 border border-gray-200 rounded p-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label htmlFor={`${formId}-person`} className="block text-xs font-medium text-gray-600 mb-0.5">
                Persona *
              </label>
              {loadingPeople ? (
                <p className="text-xs text-gray-400">Cargando personas…</p>
              ) : (
                <select
                  id={`${formId}-person`}
                  required
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none"
                >
                  <option value="">Selecciona persona…</option>
                  {activePeople.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-pct`} className="block text-xs font-medium text-gray-600 mb-0.5">
                Porcentaje (%) *
              </label>
              <input
                id={`${formId}-pct`}
                type="number"
                required
                min={0.01}
                max={100}
                step="0.01"
                value={percentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                className={`w-full border rounded px-2 py-1 text-xs focus:ring-1 focus:outline-none ${
                  warning ? 'border-amber-400 focus:ring-amber-400' : 'border-gray-300 focus:ring-blue-400'
                }`}
              />
              {warning && (
                <p role="status" aria-live="polite" className="mt-0.5 text-xs text-amber-600">
                  {warning}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-from`} className="block text-xs font-medium text-gray-600 mb-0.5">
                Válido desde *
              </label>
              <input
                id={`${formId}-from`}
                type="date"
                required
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={`${formId}-to`} className="block text-xs font-medium text-gray-600 mb-0.5">
                Válido hasta
              </label>
              <input
                id={`${formId}-to`}
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={assignOwner.isPending}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
            >
              {assignOwner.isPending ? 'Guardando…' : 'Asignar titular'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); setWarning(null) }}
              className="px-3 py-1 text-xs text-gray-500 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
