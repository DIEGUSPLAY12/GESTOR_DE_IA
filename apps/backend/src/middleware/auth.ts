import type { Request, Response, NextFunction } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const jwksUri = process.env['AZURE_AD_JWKS_URI']
const audience = process.env['AZURE_AD_CLIENT_ID']

const JWKS = jwksUri ? createRemoteJWKSet(new URL(jwksUri)) : null

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

  if (!JWKS) {
    // Dev mode: skip signature verification, decode only
    const [, encodedPayload] = token.split('.')
    if (!encodedPayload) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }
    const decoded = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as Record<string, unknown>
    const email = decoded['email']
    const roles = decoded['roles']
    req.user = {
      sub: decoded['sub'] as string,
      ...(typeof email === 'string' ? { email } : {}),
      ...(Array.isArray(roles) ? { roles: roles as string[] } : {}),
    }
    next()
    return
  }

  try {
    const { payload } = await jwtVerify(
      token,
      JWKS,
      ...(audience ? [{ audience }] : []),
    )
    const email = payload['email']
    const roles = payload['roles']
    req.user = {
      sub: payload.sub as string,
      ...(typeof email === 'string' ? { email } : {}),
      ...(Array.isArray(roles) ? { roles: roles as string[] } : {}),
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
