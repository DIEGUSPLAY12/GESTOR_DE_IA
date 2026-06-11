import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api.js'
import type {
  AiAccount,
  AiProvider,
  AccountOwnership,
  AssignOwnerInput,
  AssignProjectInput,
  CreateAccountInput,
  CreatePersonInput,
  CreateProjectInput,
  Person,
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
  accounts: ['accounts'] as const,
  accountOwners: (accountId: string) => ['accounts', accountId, 'owners'] as const,
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
