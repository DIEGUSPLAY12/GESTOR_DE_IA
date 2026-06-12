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
  // Include the user's auth ID in the query key so that different users never
  // share cached data. Without this, user B after user A would see A's name/role.
  const userId = session?.user?.id ?? null

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me', userId],
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
