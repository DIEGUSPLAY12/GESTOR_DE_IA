import type { BudgetSummary, BudgetStatus } from '../types.js'
import { BUDGET_STATUS_LABEL } from '../types.js'

const STATUS_CLASSES: Record<BudgetStatus, { card: string; badge: string; bar: string }> = {
  OK: {
    card: 'border-green-200 bg-green-50',
    badge: 'bg-alten-mid-blue text-alten-dark',
    bar: 'bg-green-500',
  },
  WARNING: {
    card: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-100 text-amber-800',
    bar: 'bg-amber-400',
  },
  DANGER: {
    card: 'border-red-200 bg-red-50',
    badge: 'bg-red-100 text-red-800',
    bar: 'bg-red-500',
  },
}

interface DeviationsAlertProps {
  summary: BudgetSummary
}

export function DeviationsAlert({ summary }: DeviationsAlertProps) {
  const { project_name, project_code, monthly_budget, actual_cost, percentage_used, status } =
    summary
  const classes = STATUS_CLASSES[status]
  const label = BUDGET_STATUS_LABEL[status]
  const pct = percentage_used ?? 0
  const barWidth = Math.min(pct, 100)

  return (
    <article
      aria-label={`Desviación de presupuesto: ${project_name}`}
      className={`rounded-lg border p-4 ${classes.card}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs text-alten-mid font-mono">{project_code}</p>
          <h3 className="font-semibold text-alten-body">{project_name}</h3>
        </div>
        <span
          aria-label={`Estado: ${label}`}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes.badge}`}
        >
          {label}
        </span>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Consumo: ${pct.toFixed(1)}%`}
        className="w-full bg-alten-border rounded-full h-2 mb-3"
      >
        <div
          className={`h-2 rounded-full transition-all ${classes.bar}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Cost figures */}
      <div className="flex justify-between text-sm text-alten-body">
        <span>
          Real:{' '}
          <strong>
            {Number(actual_cost).toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            €
          </strong>
        </span>
        <span>
          Límite:{' '}
          <strong>
            {monthly_budget != null
              ? `${Number(monthly_budget).toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} €`
              : 'Sin límite'}
          </strong>
        </span>
      </div>

      {percentage_used != null && (
        <p
          aria-live="polite"
          className="mt-1 text-xs text-alten-mid text-right"
        >
          {pct.toFixed(1)}% consumido
        </p>
      )}
    </article>
  )
}
