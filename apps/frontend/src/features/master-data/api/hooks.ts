import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api.js'
import { DEMO_PROJECTS, DEMO_PEOPLE, DEMO_PROVIDERS, DEMO_PLANS, DEMO_ACCOUNTS } from '../../../lib/demo-data.js'
import type {
  AiAccount,
  AiProvider,
  AccountOwnership,
  AssignOwnerInput,
  AssignProjectInput,
  CreateAccountInput,
  CreatePersonInput,
  CreatePlanInput,
  CreateProjectInput,
  CreateProviderInput,
  Person,
  PricingPlan,
  Project,
  ProjectAssignment,
  UpdatePersonInput,
  UpdateProjectInput,
} from '../types.js'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const KEYS = {
  people: ['people'] as const,
  projects: ['projects'] as const,
  providers: ['providers'] as const,
  plans: (providerId: string) => ['providers', providerId, 'plans'] as const,
  accounts: ['accounts'] as const,
  accountOwners: (accountId: string) => ['accounts', accountId, 'owners'] as const,
  personAssignments: (personId: string) => ['people', personId, 'assignments'] as const,
}

// ─── People ───────────────────────────────────────────────────────────────────

export function usePersons() {
  return useQuery({
    queryKey: KEYS.people,
    queryFn: async () => {
      try {
        return await api.get<{ data: Person[] }>('/people').then((r) => r.data)
      } catch {
        return DEMO_PEOPLE
      }
    },
  })
}

export function useCreatePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePersonInput) =>
      api.post<{ data: Person }>('/people', input).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.people }) },
  })
}

export function useUpdatePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: UpdatePersonInput & { id: string }) =>
      api.patch<{ data: Person }>(`/people/${id}`, input).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.people }) },
  })
}

export function useDeletePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/people/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.people }) },
  })
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: KEYS.projects,
    queryFn: async () => {
      try {
        return await api.get<{ data: Project[] }>('/projects').then((r) => r.data)
      } catch {
        return DEMO_PROJECTS
      }
    },
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      api.post<{ data: Project }>('/projects', input).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.projects }) },
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateProjectInput & { id: string }) =>
      api.patch<{ data: Project }>(`/projects/${id}`, input).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.projects }) },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.projects }) },
  })
}

// ─── Providers ────────────────────────────────────────────────────────────────

export function useProviders() {
  return useQuery({
    queryKey: KEYS.providers,
    queryFn: async () => {
      try {
        return await api.get<{ data: AiProvider[] }>('/providers').then((r) => r.data)
      } catch {
        return DEMO_PROVIDERS
      }
    },
  })
}

export function useCreateProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProviderInput) =>
      api.post<{ data: AiProvider }>('/providers', input).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.providers }) },
  })
}

export function useDeleteProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/providers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.providers }) },
  })
}

export function usePlans(providerId: string) {
  return useQuery({
    queryKey: KEYS.plans(providerId),
    queryFn: async () => {
      try {
        return await api
          .get<{ data: PricingPlan[] }>(`/providers/${providerId}/plans`)
          .then((r) => r.data)
      } catch {
        return DEMO_PLANS.filter((p) => p.provider_id === providerId)
      }
    },
    enabled: Boolean(providerId),
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ providerId, ...input }: CreatePlanInput & { providerId: string }) =>
      api
        .post<{ data: PricingPlan }>(`/providers/${providerId}/plans`, input)
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.plans(vars.providerId) })
    },
  })
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export function useAccounts() {
  return useQuery({
    queryKey: KEYS.accounts,
    queryFn: async () => {
      try {
        return await api.get<{ data: AiAccount[] }>('/accounts').then((r) => r.data)
      } catch {
        return DEMO_ACCOUNTS
      }
    },
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAccountInput) =>
      api.post<{ data: AiAccount }>('/accounts', input).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.accounts }) },
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/accounts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.accounts }) },
  })
}

export function useAccountOwners(accountId: string) {
  return useQuery({
    queryKey: KEYS.accountOwners(accountId),
    queryFn: () =>
      api.get<{ data: AccountOwnership[] }>(`/accounts/${accountId}/owners`).then((r) => r.data),
    enabled: Boolean(accountId),
  })
}

// ─── Assign owner to account ──────────────────────────────────────────────────

export function useAssignOwner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, ...input }: AssignOwnerInput & { accountId: string }) =>
      api
        .post<{ data: AccountOwnership }>(`/accounts/${accountId}/owners`, input)
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.accountOwners(vars.accountId) })
      qc.invalidateQueries({ queryKey: KEYS.accounts })
    },
  })
}

// ─── Assign person to project ─────────────────────────────────────────────────

export function usePersonAssignments(personId: string) {
  return useQuery({
    queryKey: KEYS.personAssignments(personId),
    queryFn: () =>
      api
        .get<{ data: ProjectAssignment[] }>(`/people/${personId}/assignments`)
        .then((r) => r.data),
    enabled: Boolean(personId),
  })
}

export function useAssignProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ personId, ...input }: AssignProjectInput & { personId: string }) =>
      api
        .post<{ data: ProjectAssignment }>(`/people/${personId}/assignments`, input)
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.personAssignments(vars.personId) })
      qc.invalidateQueries({ queryKey: KEYS.people })
    },
  })
}
