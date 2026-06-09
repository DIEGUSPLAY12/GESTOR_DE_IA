const BASE_URL = '/api/v1'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem('access_token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
    throw new ApiError(res.status, body.error ?? res.statusText)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
