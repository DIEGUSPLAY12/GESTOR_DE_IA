import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api.js'
import type { ConsultantCostView } from '../types.js'

// Demo fallback data for presentation without backend
const DEMO_COSTS: ConsultantCostView[] = [
  {
    account_name: 'copilot-marta@alten.es',
    provider_name: 'Microsoft',
    period_month: '2026-06',
    allocated_cost: '19.0000',
    currency: 'EUR',
    ownership_pct: '100.00',
    calculation_trace: 'PER_SEAT: 19.00 × 100% × 30/30d',
  },
  {
    account_name: 'openai-api-shared',
    provider_name: 'OpenAI',
    period_month: '2026-06',
    allocated_cost: '34.2500',
    currency: 'EUR',
    ownership_pct: '25.00',
    calculation_trace: 'PAY_PER_TOKEN: 137.00 × 25%',
  },
]

export function useMyConsultantCosts(periodMonth: string) {
  return useQuery({
    queryKey: ['consultant-costs', periodMonth],
    queryFn: async () => {
      try {
        return await api
          .get<{ data: ConsultantCostView[] }>(
            `/consultants/me/costs?period_month=${encodeURIComponent(periodMonth)}`,
          )
          .then((r) => r.data)
      } catch {
        return DEMO_COSTS
      }
    },
    enabled: Boolean(periodMonth),
  })
}
