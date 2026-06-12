import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string
    email?: string
    roles?: string[]
  }
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

    const roles =
      (user.app_metadata?.['roles'] as string[] | undefined) ?? ['CONSULTANT']

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
