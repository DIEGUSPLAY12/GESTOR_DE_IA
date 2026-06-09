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
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const token = authHeader.slice(7)

  if (!JWKS) {
    // Dev mode: skip signature verification, decode only
    const [, payload] = token.split('.')
    if (!payload) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Record<string, unknown>
    req.user = {
      sub: decoded['sub'] as string,
      email: decoded['email'] as string | undefined,
      roles: decoded['roles'] as string[] | undefined,
    }
    next()
    return
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, { audience })
    req.user = {
      sub: payload.sub as string,
      email: payload['email'] as string | undefined,
      roles: payload['roles'] as string[] | undefined,
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
