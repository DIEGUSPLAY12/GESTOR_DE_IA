import { useState, useId } from 'react'
import {
  useProviders,
  useCreateProvider,
  useDeleteProvider,
  usePlans,
  useCreatePlan,
} from '../api/hooks.js'
import type { AiProvider, PlanType } from '../types.js'

const PLAN_TYPES: { value: PlanType; label: string }[] = [
  { value: 'PER_SEAT', label: 'Por asiento (PER_SEAT)' },
  { value: 'POOL_SLOT', label: 'Pool de slots (POOL_SLOT)' },
  { value: 'PAY_PER_TOKEN', label: 'Pago por token (PAY_PER_TOKEN)' },
  { value: 'VOLUME_TIER', label: 'Tramo de volumen (VOLUME_TIER)' },
]

const PLAN_TYPE_BADGE: Record<PlanType, string> = {
  PER_SEAT: 'bg-alten-pale text-alten-blue',
  POOL_SLOT: 'bg-purple-100 text-purple-700',
  PAY_PER_TOKEN: 'bg-orange-100 text-orange-700',
  VOLUME_TIER: 'bg-teal-100 text-teal-700',
}

// ─── Plan sub-list for one provider ──────────────────────────────────────────

function PlansList({ provider }: { provider: AiProvider }) {
  const formId = useId()
  const { data: plans, isLoading } = usePlans(provider.id)
  const createPlan = useCreatePlan()
  const [showForm, setShowForm] = useState(false)
  const [planName, setPlanName] = useState('')
  const [planType, setPlanType] = useState<PlanType>('PER_SEAT')
  const [unitPrice, setUnitPrice] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleAddPlan(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await createPlan.mutateAsync({
        providerId: provider.id,
        type: planType,
        name: planName,
        ...(unitPrice ? { unit_price: Number(unitPrice) } : {}),
        currency,
        effective_from: effectiveFrom,
      })
      setPlanName('')
      setUnitPrice('')
      setEffectiveFrom('')
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  return (
    <div className="mt-3 pl-4 border-l-2 border-alten-light">
      {isLoading && <p className="text-xs text-alten-mid py-2">Cargando planes…</p>}

      {!isLoading && (plans ?? []).length === 0 && (
        <p className="text-xs text-alten-mid py-2">Sin planes configurados.</p>
      )}

      {!isLoading && (plans ?? []).length > 0 && (
        <table className="min-w-full text-xs mb-3">
          <thead>
            <tr className="text-alten-mid">
              <th scope="col" className="text-left pr-4 py-1 font-medium">Nombre</th>
              <th scope="col" className="text-left pr-4 py-1 font-medium">Tipo</th>
              <th scope="col" className="text-right pr-4 py-1 font-medium">Precio/unidad</th>
              <th scope="col" className="text-left py-1 font-medium">Vigencia desde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(plans ?? []).map((plan) => (
              <tr key={plan.id}>
                <td className="pr-4 py-1.5 text-alten-body font-medium">{plan.name}</td>
                <td className="pr-4 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PLAN_TYPE_BADGE[plan.type]}`}>
                    {plan.type}
                  </span>
                </td>
                <td className="pr-4 py-1.5 text-right text-alten-body">
                  {plan.type === 'PAY_PER_TOKEN'
                    ? 'variable'
                    : `${Number(plan.unit_price).toFixed(2)} ${plan.currency}`}
                </td>
                <td className="py-1.5 text-alten-mid">{plan.effective_from}</td>
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
          + Añadir plan
        </button>
      ) : (
        <form id={`${formId}-plan`} onSubmit={handleAddPlan} className="mt-2 space-y-2 max-w-lg">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label htmlFor={`${formId}-pname`} className="block text-xs font-medium text-alten-body mb-0.5">
                Nombre del plan *
              </label>
              <input
                id={`${formId}-pname`}
                required
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="ej. GPT-4o API"
                className="w-full border border-alten-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-alten-blue focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor={`${formId}-ptype`} className="block text-xs font-medium text-alten-body mb-0.5">
                Tipo *
              </label>
              <select
                id={`${formId}-ptype`}
                value={planType}
                onChange={(e) => setPlanType(e.target.value as PlanType)}
                className="w-full border border-alten-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-alten-blue focus:outline-none"
              >
                {PLAN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-pfrom`} className="block text-xs font-medium text-alten-body mb-0.5">
                Vigencia desde *
              </label>
              <input
                id={`${formId}-pfrom`}
                type="date"
                required
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full border border-alten-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-alten-blue focus:outline-none"
              />
            </div>
            {planType !== 'PAY_PER_TOKEN' && (
              <>
                <div>
                  <label htmlFor={`${formId}-pprice`} className="block text-xs font-medium text-alten-body mb-0.5">
                    Precio/unidad
                  </label>
                  <input
                    id={`${formId}-pprice`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full border border-alten-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-alten-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={`${formId}-pcur`} className="block text-xs font-medium text-alten-body mb-0.5">
                    Moneda
                  </label>
                  <select
                    id={`${formId}-pcur`}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full border border-alten-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-alten-blue focus:outline-none"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {error && <p role="alert" className="text-xs text-alten-red">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createPlan.isPending}
              className="px-3 py-1 text-xs font-medium text-white bg-alten-blue rounded hover:bg-alten-hover disabled:opacity-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-alten-blue"
            >
              {createPlan.isPending ? 'Guardando…' : 'Guardar plan'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
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

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ProvidersPanel() {
  const formId = useId()
  const { data: providers, isLoading, error } = useProviders()
  const createProvider = useCreateProvider()
  const deleteProvider = useDeleteProvider()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  async function handleAddProvider(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    try {
      await createProvider.mutateAsync({ name: newName.trim() })
      setNewName('')
      setShowAddForm(false)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  function handleDelete(provider: AiProvider) {
    if (!window.confirm(`¿Eliminar el proveedor "${provider.name}"?`)) return
    deleteProvider.mutate(provider.id)
  }

  const activeProviders = (providers ?? []).filter((p) => p.deleted_at === null)

  return (
    <section aria-labelledby="providers-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="providers-heading" className="text-xl font-semibold">
          Proveedores de IA
        </h2>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-alten-blue rounded hover:bg-alten-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-alten-blue"
        >
          {showAddForm ? 'Cancelar' : '+ Añadir proveedor'}
        </button>
      </div>

      {showAddForm && (
        <form
          id={formId}
          onSubmit={handleAddProvider}
          className="mb-5 p-4 bg-alten-pale border border-alten-mid-blue rounded-lg flex gap-3 items-end flex-wrap"
        >
          <div>
            <label htmlFor={`${formId}-name`} className="block text-sm font-medium text-alten-body mb-1">
              Nombre del proveedor *
            </label>
            <input
              id={`${formId}-name`}
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ej. Anthropic"
              className="border border-alten-border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-alten-blue focus:outline-none w-64"
            />
          </div>
          {addError && <p role="alert" className="text-sm text-alten-red w-full">{addError}</p>}
          <button
            type="submit"
            disabled={createProvider.isPending}
            className="px-4 py-1.5 text-sm font-medium text-white bg-alten-blue rounded hover:bg-alten-hover disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-alten-blue"
          >
            {createProvider.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      )}

      {isLoading && (
        <div role="status" aria-live="polite" className="py-8 text-center text-alten-mid text-sm">
          Cargando proveedores…
        </div>
      )}

      {error && (
        <div role="alert" className="py-4 text-center text-alten-red text-sm">
          Error al cargar proveedores: {error.message}
        </div>
      )}

      {!isLoading && !error && activeProviders.length === 0 && (
        <p className="text-sm text-alten-mid py-4">No hay proveedores configurados.</p>
      )}

      {!isLoading && !error && activeProviders.length > 0 && (
        <div className="divide-y divide-alten-light border border-alten-border rounded-lg overflow-hidden">
          {activeProviders.map((provider) => {
            const isExpanded = expandedId === provider.id
            return (
              <div key={provider.id} className="bg-white">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`plans-${provider.id}`}
                    onClick={() => setExpandedId(isExpanded ? null : provider.id)}
                    className="flex items-center gap-2 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-alten-blue rounded"
                  >
                    <span
                      aria-hidden="true"
                      className="text-alten-mid text-xs w-3 inline-block transition-transform"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : undefined }}
                    >
                      ▶
                    </span>
                    <span className="font-medium text-alten-body">{provider.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(provider)}
                    className="text-xs text-alten-red hover:text-alten-red focus:outline-none focus-visible:ring-1 focus-visible:ring-alten-red rounded"
                    aria-label={`Eliminar proveedor ${provider.name}`}
                  >
                    Eliminar
                  </button>
                </div>

                {isExpanded && (
                  <div id={`plans-${provider.id}`} className="px-4 pb-4">
                    <PlansList provider={provider} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
