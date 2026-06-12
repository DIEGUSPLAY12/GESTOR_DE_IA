import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api.js'

export interface UsageLogEntry {
  id: string
  units_used: string
  unit_label: string
  calculated_cost: string
  currency: string
  period_month: string
  notes: string | null
  created_at: string
  account: {
    external_identifier: string
    pricing_plan: {
      name: string
      type: string
      provider: { name: string }
    }
  } | null
  project: { code: string; name: string } | null
}

export interface LogUsageInput {
  account_id: string
  project_id: string
  units_used: number
  unit_label?: string
  notes?: string
  period_month: string
}

export const USAGE_KEYS = {
  my: (periodMonth: string) => ['usage', periodMonth] as const,
}

export function useMyUsage(periodMonth: string) {
  return useQuery({
    queryKey: USAGE_KEYS.my(periodMonth),
    queryFn: () =>
      api
        .get<{ data: UsageLogEntry[] }>(`/usage/me?period_month=${encodeURIComponent(periodMonth)}`)
        .then((r) => r.data),
    enabled: Boolean(periodMonth),
  })
}

export function useLogUsage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LogUsageInput) =>
      api.post<{ data: UsageLogEntry }>('/usage', input).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: USAGE_KEYS.my(vars.period_month) })
      qc.invalidateQueries({ queryKey: ['budgets', vars.period_month] })
    },
  })
}
