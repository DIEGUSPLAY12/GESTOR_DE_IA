import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api.js'
import type { ConsultantCostView } from '../types.js'

export function useMyConsultantCosts(periodMonth: string) {
  return useQuery({
    queryKey: ['consultant-costs', periodMonth],
    queryFn: () =>
      api
        .get<{ data: ConsultantCostView[] }>(
          `/consultants/me/costs?period_month=${encodeURIComponent(periodMonth)}`,
        )
        .then((r) => r.data),
    enabled: Boolean(periodMonth),
  })
}
