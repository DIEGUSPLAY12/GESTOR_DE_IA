import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api.js'
import type {
  AiAccount,
  AiProvider,
  AccountOwnership,
  AssignOwnerInput,
  JoinProjectInput,
  CreateAccountInput,
  CreatePersonInput,
  CreatePlanInput,
  CreateProjectInput,
  CreateProviderInput,
  MySubscription,
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
  myAccounts: ['accounts', 'mine'] as const,
  personAssignments: (personId: string) => ['people', personId, 'assignments'] as const,
}

// ─── People ───────────────────────────────────────────────────────────────────

export function usePersons() {
  return useQuery({
    queryKey: KEYS.people,
    queryFn: () => api.get<{ data: Person[] }>('/people').then((r) => r.data),
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
    queryFn: () => api.get<{ data: Project[] }>('/projects').then((r) => r.data),
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
    queryFn: () => api.get<{ data: AiProvider[] }>('/providers').then((r) => r.data),
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
    queryFn: () =>
      api.get<{ data: PricingPlan[] }>(`/providers/${providerId}/plans`).then((r) => r.data),
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
    queryFn: () => api.get<{ data: AiAccount[] }>('/accounts').then((r) => r.data),
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

// ─── My subscriptions (user's AI tools) ──────────────────────────────────────

export function useMyAccounts() {
  return useQuery({
    queryKey: KEYS.myAccounts,
    queryFn: () =>
      api.get<{ data: MySubscription[] }>('/accounts/mine').then((r) => r.data),
  })
}

export function useSubscribeAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (accountId: string) =>
      api.post<{ data: unknown }>(`/accounts/${accountId}/subscribe`, {}).then((r) => r.data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: KEYS.myAccounts }) },
  })
}

export function useUnsubscribeAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (accountId: string) =>
      api.delete<{ message: string }>(`/accounts/${accountId}/subscribe`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: KEYS.myAccounts }) },
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

export function useJoinProject(personId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, ...input }: JoinProjectInput) =>
      api
        .post<{ data: ProjectAssignment }>(`/projects/${projectId}/join`, input)
        .then((r) => r.data),
    onSuccess: () => {
      // Refresh the user's assignments so the "Participando" badge appears immediately
      if (personId) {
        void qc.invalidateQueries({ queryKey: KEYS.personAssignments(personId) })
      } else {
        void qc.invalidateQueries({ queryKey: KEYS.people })
      }
      // Refresh budgets so the joined project appears in BudgetDashboard
      void qc.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}
