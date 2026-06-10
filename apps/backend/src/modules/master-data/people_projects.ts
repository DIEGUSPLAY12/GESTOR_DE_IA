import { Router } from 'express'
import { supabase } from '../../lib/supabase.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'

// ─── People router ────────────────────────────────────────────────────────────

const peopleRouter = Router()

// GET /api/v1/people
// Query: ?include_deleted=true to include soft-deleted records
peopleRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const includeDeleted = req.query['include_deleted'] === 'true'
    let query = supabase.from('person').select('*').order('full_name')
    if (!includeDeleted) query = query.is('deleted_at', null)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    res.json({ data: data ?? [] })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/people
peopleRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>
    const { email, full_name, role } = body

    if (typeof email !== 'string' || !email.includes('@') || typeof full_name !== 'string') {
      res.status(400).json({ error: 'email (valid address) and full_name are required' })
      return
    }

    const { data, error } = await supabase
      .from('person')
      .insert({
        email,
        full_name,
        ...(typeof role === 'string' ? { role } : {}),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: `Email "${email}" is already registered` })
        return
      }
      throw new Error(error.message)
    }

    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/people/:id
peopleRouter.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const body = req.body as Record<string, unknown>
    const updates: Record<string, unknown> = {}

    if (typeof body['email'] === 'string') updates['email'] = body['email']
    if (typeof body['full_name'] === 'string') updates['full_name'] = body['full_name']
    if (typeof body['role'] === 'string') updates['role'] = body['role']

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields provided for update' })
      return
    }

    const { data, error } = await supabase
      .from('person')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Person not found' })
        return
      }
      if (error.code === '23505') {
        res.status(409).json({ error: 'Email already in use' })
        return
      }
      throw new Error(error.message)
    }

    res.json({ data })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/people/:id — soft delete + close active assignments
peopleRouter.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const now = new Date().toISOString()
    const today = now.slice(0, 10)

    // Soft-close any open project assignments for this person
    await supabase
      .from('project_assignment')
      .update({ valid_to: today })
      .eq('person_id', id)
      .is('valid_to', null)

    // Soft-close any open account ownerships
    await supabase
      .from('account_ownership')
      .update({ valid_to: today })
      .eq('person_id', id)
      .is('valid_to', null)

    // Soft-delete the person
    const { error } = await supabase
      .from('person')
      .update({ deleted_at: now })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    res.json({ message: 'Person soft-deleted and active assignments closed' })
  } catch (err) {
    next(err)
  }
})

// ─── Projects router ──────────────────────────────────────────────────────────

const projectsRouter = Router()

// GET /api/v1/projects
// Query: ?include_deleted=true
projectsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const includeDeleted = req.query['include_deleted'] === 'true'
    let query = supabase.from('project').select('*').order('name')
    if (!includeDeleted) query = query.is('deleted_at', null)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    res.json({ data: data ?? [] })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/projects
projectsRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>
    const { code, name, client_name, project_manager_id, start_date, end_date, monthly_budget } = body

    if (
      typeof code !== 'string' ||
      typeof name !== 'string' ||
      typeof client_name !== 'string' ||
      typeof project_manager_id !== 'string' ||
      typeof start_date !== 'string'
    ) {
      res.status(400).json({
        error: 'Required fields: code, name, client_name, project_manager_id, start_date',
      })
      return
    }

    const { data, error } = await supabase
      .from('project')
      .insert({
        code,
        name,
        client_name,
        project_manager_id,
        start_date,
        ...(typeof end_date === 'string' ? { end_date } : {}),
        ...(monthly_budget !== undefined ? { monthly_budget } : {}),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: `Project code "${code}" already exists` })
        return
      }
      throw new Error(error.message)
    }

    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/projects/:id
projectsRouter.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const body = req.body as Record<string, unknown>
    const allowed = ['name', 'client_name', 'project_manager_id', 'start_date', 'end_date', 'monthly_budget']
    const updates: Record<string, unknown> = {}

    for (const field of allowed) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields provided for update' })
      return
    }

    const { data, error } = await supabase
      .from('project')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      throw new Error(error.message)
    }

    res.json({ data })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/projects/:id — soft delete
projectsRouter.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }

    const { error } = await supabase
      .from('project')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    res.json({ message: 'Project soft-deleted' })
  } catch (err) {
    next(err)
  }
})

export { peopleRouter, projectsRouter }
