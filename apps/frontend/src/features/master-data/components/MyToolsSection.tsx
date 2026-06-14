import { useAccounts, useMyAccounts, useSubscribeAccount, useUnsubscribeAccount } from '../api/hooks.js'
import type { AiAccount } from '../types.js'

// Group accounts by provider name
function groupByProvider(accounts: AiAccount[]): Map<string, AiAccount[]> {
  const map = new Map<string, AiAccount[]>()
  for (const acc of accounts) {
    const provider = acc.pricing_plan?.provider?.name ?? 'Otros'
    const list = map.get(provider) ?? []
    list.push(acc)
    map.set(provider, list)
  }
  return map
}

interface AccountCardProps {
  account: AiAccount
  isSubscribed: boolean
  isPending: boolean
  onSubscribe: (id: string) => void
  onUnsubscribe: (id: string) => void
}

function AccountCard({ account, isSubscribed, isPending, onSubscribe, onUnsubscribe }: AccountCardProps) {
  const plan = account.pricing_plan
  const monthlyPrice = plan?.type === 'PER_SEAT'
    ? `€${Number(plan.unit_price).toFixed(2)}/mes`
    : plan?.type === 'PAY_PER_TOKEN'
    ? `€${Number(plan.unit_price).toFixed(4)}/1K tokens`
    : null

  return (
    <div className={`rounded-lg border p-3 flex items-center justify-between gap-3 ${
      isSubscribed ? 'border-alten-mid-blue bg-alten-pale' : 'border-alten-border bg-white'
    }`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-alten-body truncate">
            {plan?.name ?? account.external_identifier}
          </span>
          {isSubscribed && (
            <span className="text-xs bg-alten-blue text-white rounded-full px-2 py-0.5 font-medium">
              En mi perfil
            </span>
          )}
        </div>
        <p className="text-xs text-alten-mid mt-0.5">
          {account.external_identifier}
          {monthlyPrice && <span className="ml-2 font-medium text-alten-body">{monthlyPrice}</span>}
        </p>
      </div>

      {isSubscribed ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => onUnsubscribe(account.id)}
          className="flex-shrink-0 rounded border border-alten-border px-3 py-1 text-xs text-alten-body hover:bg-alten-light disabled:opacity-50"
        >
          Quitar
        </button>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => onSubscribe(account.id)}
          className="flex-shrink-0 rounded bg-alten-blue px-3 py-1 text-xs font-medium text-white hover:bg-alten-hover disabled:opacity-50"
        >
          + Añadir
        </button>
      )}
    </div>
  )
}

export function MyToolsSection() {
  const { data: allAccounts, isLoading: loadingAll } = useAccounts()
  const { data: mySubscriptions, isLoading: loadingMine } = useMyAccounts()
  const subscribe = useSubscribeAccount()
  const unsubscribe = useUnsubscribeAccount()

  const subscribedIds = new Set((mySubscriptions ?? []).map((s) => s.account_id))

  const activeAccounts = (allAccounts ?? []).filter(
    (a) => a.deleted_at === null && (a.valid_to === null || a.valid_to >= new Date().toISOString().slice(0, 10)),
  )

  const grouped = groupByProvider(activeAccounts)

  const isPending = subscribe.isPending || unsubscribe.isPending

  if (loadingAll || loadingMine) {
    return <p className="text-sm text-alten-mid py-4">Cargando herramientas…</p>
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-alten-mid">
        Añade las herramientas de IA que tienes suscritas. Aparecerán disponibles cuando registres uso en un proyecto.
      </p>

      {grouped.size === 0 && (
        <p className="text-sm text-alten-mid">No hay cuentas de IA configuradas en el sistema.</p>
      )}

      {Array.from(grouped.entries()).map(([provider, accounts]) => (
        <div key={provider}>
          <h3 className="text-xs font-semibold text-alten-mid uppercase tracking-wider mb-2">{provider}</h3>
          <div className="space-y-2">
            {accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                account={acc}
                isSubscribed={subscribedIds.has(acc.id)}
                isPending={isPending}
                onSubscribe={(id) => { subscribe.mutate(id) }}
                onUnsubscribe={(id) => { unsubscribe.mutate(id) }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
