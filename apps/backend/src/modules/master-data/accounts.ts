import { Router } from 'express'
import { supabase } from '../../lib/supabase.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import type { AuthenticatedRequest } from '../../middleware/auth.js'
import { validateOwnershipSum } from './validators.js'

async function resolvePersonId(req: AuthenticatedRequest): Promise<string | null> {
  const email = req.user?.email
  if (!email) return null
  const { data } = await supabase
    .from('person')
    .select('id')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  return data ? (data as { id: string }).id : null
}

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/
const PLAN_TYPES = ['PER_SEAT', 'PAY_PER_TOKEN'] as const
const CURRENCY_RE = /^[A-Z]{3}$/

function isValidDate(s: unknown): s is string {
  return typeof s === 'string' && DATE_RE.test(s)
}

// ─── Providers router ─────────────────────────────────────────────────────────

const providersRouter = Router()

// GET /api/v1/providers
providersRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const includeDeleted = req.query['include_deleted'] === 'true'
    let query = supabase.from('ai_provider').select('*').order('name')
    if (!includeDeleted) query = query.is('deleted_at', null)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    res.json({ data: data ?? [] })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/providers
providersRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>

    if (typeof body['name'] !== 'string' || !body['name'].trim()) {
      res.status(400).json({ error: 'name is required' })
      return
    }

    const { data, error } = await supabase
      .from('ai_provider')
      .insert({ name: body['name'].trim() })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: `Provider "${body['name']}" already exists` })
        return
      }
      throw new Error(error.message)
    }

    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/providers/:id/plans
providersRouter.get('/:id/plans', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const includeDeleted = req.query['include_deleted'] === 'true'

    let query = supabase
      .from('pricing_plan')
      .select('*')
      .eq('provider_id', id)
      .order('effective_from', { ascending: false })

    if (!includeDeleted) query = query.is('deleted_at', null)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    res.json({ data: data ?? [] })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/providers/:id/plans
providersRouter.post('/:id/plans', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id: provider_id } = req.params as { id: string }
    const body = req.body as Record<string, unknown>
    const {
      type, name, unit_price, currency, effective_from, effective_to,
      price_per_input_token, price_per_output_token, contracted_at, activated_at,
    } = body

    if (
      !PLAN_TYPES.includes(type as (typeof PLAN_TYPES)[number]) ||
      typeof name !== 'string' ||
      !isValidDate(effective_from)
    ) {
      res.status(400).json({
        error: `Required: type (${PLAN_TYPES.join('|')}), name, effective_from (YYYY-MM-DD)`,
      })
      return
    }

    const currency_val = typeof currency === 'string' ? currency.toUpperCase() : 'EUR'
    if (!CURRENCY_RE.test(currency_val)) {
      res.status(400).json({ error: 'currency must be a 3-letter ISO 4217 code' })
      return
    }

    const { data, error } = await supabase
      .from('pricing_plan')
      .insert({
        provider_id,
        type,
        name,
        unit_price: unit_price ?? 0,
        currency: currency_val,
        effective_from,
        ...(isValidDate(effective_to) ? { effective_to } : {}),
        ...(typeof price_per_input_token === 'number' ? { price_per_input_token } : {}),
        ...(typeof price_per_output_token === 'number' ? { price_per_output_token } : {}),
        ...(isValidDate(contracted_at) ? { contracted_at } : {}),
        ...(isValidDate(activated_at) ? { activated_at } : {}),
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
})

// ─── Accounts router ──────────────────────────────────────────────────────────

const accountsRouter = Router()

// GET /api/v1/accounts
// Query: ?active=true (default) | ?active=false | ?include_deleted=true
accountsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const includeDeleted = req.query['include_deleted'] === 'true'

    let query = supabase
      .from('ai_account')
      .select('*, pricing_plan:pricing_plan_id(type, name, currency, unit_price, provider:provider_id(name))')
      .order('valid_from', { ascending: false })

    if (!includeDeleted) query = query.is('deleted_at', null)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    res.json({ data: data ?? [] })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/accounts
accountsRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>
    const { pricing_plan_id, external_identifier, valid_from, valid_to } = body

    if (
      typeof pricing_plan_id !== 'string' ||
      typeof external_identifier !== 'string' ||
      !isValidDate(valid_from)
    ) {
      res.status(400).json({
        error: 'Required: pricing_plan_id (UUID), external_identifier, valid_from (YYYY-MM-DD)',
      })
      return
    }

    const { data, error } = await supabase
      .from('ai_account')
      .insert({
        pricing_plan_id,
        external_identifier,
        valid_from,
        ...(isValidDate(valid_to) ? { valid_to } : {}),
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/accounts/:id
accountsRouter.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const body = req.body as Record<string, unknown>
    const allowed = ['external_identifier', 'valid_from', 'valid_to', 'pricing_plan_id']
    const updates: Record<string, unknown> = {}

    for (const field of allowed) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields provided for update' })
      return
    }

    const { data, error } = await supabase
      .from('ai_account')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Account not found' })
        return
      }
      throw new Error(error.message)
    }

    res.json({ data })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/accounts/:id — soft delete
accountsRouter.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }

    const { error } = await supabase
      .from('ai_account')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    res.json({ message: 'Account soft-deleted' })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/accounts/:id/owners
// Body: { person_id, percentage, valid_from, valid_to? }
// Validates that total ownership for the account won't exceed 100%
accountsRouter.post('/:id/owners', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id: account_id } = req.params as { id: string }
    const body = req.body as Record<string, unknown>
    const { person_id, percentage, valid_from, valid_to } = body

    if (
      typeof person_id !== 'string' ||
      typeof percentage !== 'number' ||
      percentage <= 0 ||
      percentage > 100 ||
      !isValidDate(valid_from)
    ) {
      res.status(400).json({
        error: 'Required: person_id (UUID), percentage (0 < x ≤ 100), valid_from (YYYY-MM-DD)',
      })
      return
    }

    // Business rule: ownership sum must not exceed 100%
    const validation = await validateOwnershipSum(
      account_id,
      percentage,
      valid_from,
      isValidDate(valid_to) ? valid_to : null,
    )

    if (!validation.valid) {
      res.status(422).json({ error: validation.message })
      return
    }

    const { data, error } = await supabase
      .from('account_ownership')
      .insert({
        account_id,
        person_id,
        percentage,
        valid_from,
        ...(isValidDate(valid_to) ? { valid_to } : {}),
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/accounts/mine
// Returns all active subscriptions for the current user (account_ownership with valid_to=null)
accountsRouter.get('/mine', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const personId = await resolvePersonId(req)
    if (!personId) { res.json({ data: [] }); return }

    const { data, error } = await supabase
      .from('account_ownership')
      .select(`
        id,
        account_id,
        valid_from,
        account:account_id (
          id,
          external_identifier,
          valid_to,
          pricing_plan:pricing_plan_id (
            id, name, type, unit_price, currency,
            provider:provider_id ( name )
          )
        )
      `)
      .eq('person_id', personId)
      .is('valid_to', null)
      .order('valid_from', { ascending: false })

    if (error) throw new Error(error.message)
    res.json({ data: data ?? [] })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/accounts/:accountId/subscribe
// Current user adds an AI account to their profile
accountsRouter.post('/:accountId/subscribe', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { accountId } = req.params as { accountId: string }
    const personId = await resolvePersonId(req)
    if (!personId) { res.status(403).json({ error: 'No person record found' }); return }

    const { data: existing } = await supabase
      .from('account_ownership')
      .select('id')
      .eq('account_id', accountId)
      .eq('person_id', personId)
      .is('valid_to', null)
      .maybeSingle()

    if (existing) {
      res.status(409).json({ error: 'Ya tienes esta herramienta en tu perfil' })
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('account_ownership')
      .insert({ account_id: accountId, person_id: personId, percentage: 100, valid_from: today })
      .select()
      .single()

    if (error) throw new Error(error.message)
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/accounts/:accountId/subscribe
// Current user removes an AI account from their profile
accountsRouter.delete('/:accountId/subscribe', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { accountId } = req.params as { accountId: string }
    const personId = await resolvePersonId(req)
    if (!personId) { res.status(403).json({ error: 'No person record found' }); return }

    const { error } = await supabase
      .from('account_ownership')
      .delete()
      .eq('account_id', accountId)
      .eq('person_id', personId)
      .is('valid_to', null)

    if (error) throw new Error(error.message)
    res.json({ message: 'Herramienta eliminada de tu perfil' })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/accounts/:id/owners
accountsRouter.get('/:id/owners', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }

    const { data, error } = await supabase
      .from('account_ownership')
      .select('*, person:person_id(id, full_name, email)')
      .eq('account_id', id)
      .order('valid_from', { ascending: false })

    if (error) throw new Error(error.message)
    res.json({ data: data ?? [] })
  } catch (err) {
    next(err)
  }
})

export { providersRouter, accountsRouter }
