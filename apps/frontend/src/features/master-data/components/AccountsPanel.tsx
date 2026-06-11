import { useState, useId } from 'react'
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useProviders,
  usePlans,
} from '../api/hooks.js'
import type { AiAccount, CreateAccountInput, PlanType } from '../types.js'

const PLAN_TYPE_BADGE: Record<PlanType, string> = {
  PER_SEAT: 'bg-blue-100 text-blue-700',
  POOL_SLOT: 'bg-purple-100 text-purple-700',
  PAY_PER_TOKEN: 'bg-orange-100 text-orange-700',
  VOLUME_TIER: 'bg-teal-100 text-teal-700',
}

// ─── Plan selector — shows all plans for a given provider ──────────────────

function PlanOptions({ providerId }: { providerId: string }) {
  const { data: plans, isLoading } = usePlans(providerId)
  if (isLoading) return <option disabled>Cargando planes…</option>
  if (!plans || plans.length === 0) return <option disabled>Sin planes</option>
  return (
    <>
      {plans.map((plan) => (
        <option key={plan.id} value={plan.id}>
          {plan.name} ({plan.type})
        </option>
      ))}
    </>
  )
}

// ─── Create account form ───────────────────────────────────────────────────

interface CreateFormProps {
  onClose: () => void
}

function CreateAccountForm({ onClose }: CreateFormProps) {
  const formId = useId()
  const { data: providers, isLoading: loadingProviders } = useProviders()
  const createAccount = useCreateAccount()

  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [planId, setPlanId] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const activeProviders = (providers ?? []).filter((p) => p.deleted_at === null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!planId) { setError('Selecciona un plan de precios.'); return }

    const input: CreateAccountInput = {
      pricing_plan_id: planId,
      external_identifier: identifier.trim(),
      valid_from: validFrom,
      ...(validTo ? { valid_to: validTo } : {}),
    }

    try {
      await createAccount.mutateAsync(input)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3 max-w-2xl"
    >
      <h3 className="text-sm font-semibold text-gray-700">Nueva cuenta de IA</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${formId}-provider`} className="block text-xs font-medium text-gray-600 mb-0.5">
            Proveedor *
          </label>
          {loadingProviders ? (
            <p className="text-xs text-gray-400">Cargando proveedores…</p>
          ) : (
            <select
              id={`${formId}-provider`}
              required
              value={selectedProviderId}
              onChange={(e) => { setSelectedProviderId(e.target.value); setPlanId('') }}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">Selecciona proveedor…</option>
              {activeProviders.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-plan`} className="block text-xs font-medium text-gray-600 mb-0.5">
            Plan de precios *
          </label>
          <select
            id={`${formId}-plan`}
            required
            disabled={!selectedProviderId}
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">
              {selectedProviderId ? 'Selecciona plan…' : '— elige proveedor primero —'}
            </option>
            {selectedProviderId && <PlanOptions providerId={selectedProviderId} />}
          </select>
        </div>

        <div className="col-span-2">
          <label htmlFor={`${formId}-id`} className="block text-xs font-medium text-gray-600 mb-0.5">
            Identificador externo *
          </label>
          <input
            id={`${formId}-id`}
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="ej. copilot-marta@alten.es"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
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
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={createAccount.isPending}
          className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {createAccount.isPending ? 'Guardando…' : 'Crear cuenta'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 text-sm text-gray-500 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── Account row ──────────────────────────────────────────────────────────────

function AccountRow({ account, onDelete }: { account: AiAccount; onDelete: (id: string) => void }) {
  const plan = account.pricing_plan
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-mono text-gray-800 max-w-xs truncate" title={account.external_identifier}>
        {account.external_identifier}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {plan ? (
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PLAN_TYPE_BADGE[plan.type]}`}>
              {plan.type}
            </span>
            <span>{plan.name}</span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
        {plan?.type === 'PAY_PER_TOKEN' ? (
          <span className="text-gray-400">variable</span>
        ) : plan ? (
          `${Number(plan.unit_price).toFixed(2)} ${plan.currency}`
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{account.valid_from}</td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
        {account.valid_to ?? <span className="text-gray-400">vigente</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onDelete(account.id)}
          className="text-xs text-red-400 hover:text-red-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded"
          aria-label={`Eliminar cuenta ${account.external_identifier}`}
        >
          Eliminar
        </button>
      </td>
    </tr>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function AccountsPanel() {
  const { data: accounts, isLoading, error } = useAccounts()
  const deleteAccount = useDeleteAccount()
  const [showForm, setShowForm] = useState(false)

  function handleDelete(id: string) {
    const account = (accounts ?? []).find((a) => a.id === id)
    const label = account?.external_identifier ?? id
    if (!window.confirm(`¿Eliminar la cuenta "${label}"?`)) return
    deleteAccount.mutate(id)
  }

  const activeAccounts = (accounts ?? []).filter((a) => a.deleted_at === null)

  return (
    <section aria-labelledby="accounts-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="accounts-heading" className="text-xl font-semibold">
          Cuentas de IA
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {showForm ? 'Cancelar' : '+ Añadir cuenta'}
        </button>
      </div>

      {showForm && <CreateAccountForm onClose={() => setShowForm(false)} />}

      {isLoading && (
        <div role="status" aria-live="polite" className="py-8 text-center text-gray-500 text-sm">
          Cargando cuentas…
        </div>
      )}

      {error && (
        <div role="alert" className="py-4 text-center text-red-600 text-sm">
          Error al cargar cuentas: {error.message}
        </div>
      )}

      {!isLoading && !error && activeAccounts.length === 0 && (
        <p className="text-sm text-gray-400 py-4">No hay cuentas configuradas.</p>
      )}

      {!isLoading && !error && activeAccounts.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-100" role="table">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Identificador externo
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Plan
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Precio/unidad
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Desde
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Hasta
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {activeAccounts.map((account) => (
                <AccountRow key={account.id} account={account} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
