import { useQuery } from '@tanstack/react-query'
import { api } from './api.js'
import { useAuth } from './AuthContext.js'

export interface Person {
  id: string
  email: string
  full_name: string
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'CONSULTANT'
}

export function useCurrentUser() {
  const { session } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<{ data: Person }>('/auth/me').then((r) => r.data),
    enabled: Boolean(session),
    staleTime: 5 * 60 * 1000,
  })

  return {
    person: data ?? null,
    isAdmin: data?.role === 'ADMIN',
    isProjectManager: data?.role === 'PROJECT_MANAGER',
    isLoading,
  }
}
