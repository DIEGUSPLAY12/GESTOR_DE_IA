import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api.js'
import { DEMO_BUDGETS } from '../../../lib/demo-data.js'
import type { BudgetSummary } from '../types.js'

export function useBudgets(periodMonth: string) {
  return useQuery({
    queryKey: ['budgets', periodMonth],
    queryFn: async () => {
      try {
        return await api
          .get<{ data: BudgetSummary[] }>(`/budgets?period_month=${encodeURIComponent(periodMonth)}`)
          .then((r) => r.data)
      } catch {
        return DEMO_BUDGETS
      }
    },
    enabled: Boolean(periodMonth),
  })
}

export function useBudgetByProject(projectId: string, periodMonth: string) {
  return useQuery({
    queryKey: ['budgets', periodMonth, projectId],
    queryFn: () =>
      api
        .get<{ data: BudgetSummary }>(
          `/budgets?period_month=${encodeURIComponent(periodMonth)}&project_id=${encodeURIComponent(projectId)}`,
        )
        .then((r) => r.data),
    enabled: Boolean(projectId) && Boolean(periodMonth),
  })
}
