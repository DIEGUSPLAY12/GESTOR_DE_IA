import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string
    email?: string
    roles?: string[]
  }
}

function rolesFromPersonRole(role: string | null | undefined): string[] {
  if (role === 'ADMIN') return ['ADMIN', 'PROJECT_MANAGER', 'CONSULTANT']
  if (role === 'PROJECT_MANAGER') return ['PROJECT_MANAGER', 'CONSULTANT']
  return ['CONSULTANT']
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Dev bypass: any request is treated as ADMIN when DEV_SKIP_AUTH=true
  if (process.env['DEV_SKIP_AUTH'] === 'true') {
    req.user = {
      sub: 'dev-admin-local',
      ...(true ? { email: 'admin@alten.es' } : {}),
      ...(true ? { roles: ['ADMIN', 'PROJECT_MANAGER', 'CONSULTANT'] } : {}),
    }
    next()
    return
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const token = authHeader.slice(7)

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    // Use person.role from the DB as the single source of truth for authorization.
    // This way setting person.role = 'ADMIN' in the DB is sufficient for both
    // frontend display and backend API access — no need to also set app_metadata.
    // Falls back to CONSULTANT for users whose person record doesn't exist yet.
    let roles: string[] = ['CONSULTANT']
    if (user.email) {
      const { data: person } = await supabase
        .from('person')
        .select('role')
        .eq('email', user.email)
        .is('deleted_at', null)
        .maybeSingle()

      roles = person ? rolesFromPersonRole(person.role as string) : ['CONSULTANT']
    }

    req.user = {
      sub: user.id,
      ...(user.email ? { email: user.email } : {}),
      roles,
    }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user?.roles?.includes(role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }
    next()
  }
}
