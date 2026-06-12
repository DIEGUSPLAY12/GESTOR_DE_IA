import { Router } from 'express'
import { supabase } from '../../lib/supabase.js'
import { requireAuth } from '../../middleware/auth.js'
import type { AuthenticatedRequest } from '../../middleware/auth.js'
import type { Response, NextFunction } from 'express'

const router = Router()

// GET /api/v1/auth/me
// Returns the person record for the authenticated user.
// Auto-creates the person row on first login if it doesn't exist yet.
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const email = req.user?.email
    if (!email) {
      res.status(400).json({ error: 'Token does not contain an email address' })
      return
    }

    const { data: existing, error: fetchError } = await supabase
      .from('person')
      .select('id, email, full_name, role')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle()

    if (fetchError) throw new Error(fetchError.message)

    if (existing) {
      res.json({ data: existing })
      return
    }

    // First login — auto-create person record
    let fullName: string = email.split('@')[0] ?? email

    const sub = req.user?.sub
    if (sub && sub !== 'dev-admin-local') {
      const { data: authData } = await supabase.auth.admin.getUserById(sub)
      const metaName = authData?.user?.user_metadata?.['full_name']
      if (typeof metaName === 'string' && metaName.trim().length > 0) {
        fullName = metaName.trim()
      }
    }

    const { data: created, error: insertError } = await supabase
      .from('person')
      .insert({ email, full_name: fullName, role: 'CONSULTANT' })
      .select('id, email, full_name, role')
      .single()

    if (insertError) throw new Error(insertError.message)

    res.status(201).json({ data: created })
  } catch (err) {
    next(err)
  }
})

export { router as authRouter }
