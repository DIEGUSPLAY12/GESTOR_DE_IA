import { Router } from 'express'
import { supabase } from '../../lib/supabase.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import type { AuthenticatedRequest } from '../../middleware/auth.js'

// ─── People router ────────────────────────────────────────────────────────────

const peopleRouter = Router()

// GET /api/v1/people
// Query: ?include_deleted=true to include soft-deleted records
peopleRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const includeDeleted = req.query['include_deleted'] === 'true'
    let query = supabase.from('person').select('*').order('full_name')
    if (!includeDeleted) query = query.is('deleted_at', null)

    const { data: persons, error } = await query
    if (error) throw new Error(error.message)

    if (!includeDeleted && persons && persons.length > 0) {
      // Cross-reference with Supabase Auth to filter out users deleted from the
      // Auth dashboard who still have an active person record in the DB.
      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const activeEmails = new Set((authData?.users ?? []).map((u) => u.email).filter(Boolean))

      const orphanIds: string[] = []
      const active = (persons as { id: string; email: string }[]).filter((p) => {
        if (activeEmails.has(p.email)) return true
        orphanIds.push(p.id)
        return false
      })

      // Soft-delete orphaned records so subsequent queries don't need to re-check
      if (orphanIds.length > 0) {
        await supabase
          .from('person')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', orphanIds)
      }

      res.json({ data: active })
      return
    }

    res.json({ data: persons ?? [] })
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
// Admins can update any person and any field.
// Non-admins can only update their own full_name (self-profile edit).
peopleRouter.patch('/:id', requireAuth, async (req: import('../../middleware/auth.js').AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const isAdmin = req.user?.roles?.includes('ADMIN') ?? false
    const body = req.body as Record<string, unknown>
    const updates: Record<string, unknown> = {}

    if (isAdmin) {
      if (typeof body['email'] === 'string') updates['email'] = body['email']
      if (typeof body['full_name'] === 'string') updates['full_name'] = body['full_name']
      if (typeof body['role'] === 'string') updates['role'] = body['role']
    } else {
      // Non-admins: verify the target record belongs to the authenticated user
      const email = req.user?.email
      if (!email) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      const { data: ownPerson } = await supabase
        .from('person')
        .select('id')
        .eq('email', email)
        .is('deleted_at', null)
        .maybeSingle()

      if (!ownPerson || (ownPerson as { id: string }).id !== id) {
        res.status(403).json({ error: 'You can only update your own profile' })
        return
      }
      // Only full_name is editable by the owner
      if (typeof body['full_name'] === 'string') updates['full_name'] = body['full_name']
    }

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

// GET /api/v1/people/:personId/assignments
peopleRouter.get('/:personId/assignments', requireAuth, async (req, res, next) => {
  try {
    const { personId } = req.params as { personId: string }
    const { data, error } = await supabase
      .from('project_assignment')
      .select('*, project:project_id(id, code, name, start_date, end_date)')
      .eq('person_id', personId)
      .order('valid_from', { ascending: false })
    if (error) throw new Error(error.message)
    res.json({ data: data ?? [] })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/projects/:projectId/join
// Any authenticated user can join a project within its date range.
// percentage is set to 100 to satisfy the DB constraint (field is hidden from UI).
projectsRouter.post('/:projectId/join', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { projectId } = req.params as { projectId: string }
    const body = req.body as Record<string, unknown>
    const valid_from = body['valid_from']
    const valid_to = body['valid_to']

    if (typeof valid_from !== 'string' || !valid_from) {
      res.status(400).json({ error: 'valid_from es obligatorio' })
      return
    }

    const email = req.user?.email
    if (!email) { res.status(401).json({ error: 'Unauthorized' }); return }

    const { data: person } = await supabase
      .from('person')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle()
    if (!person) { res.status(404).json({ error: 'Perfil de usuario no encontrado' }); return }

    const { data: project, error: projectError } = await supabase
      .from('project')
      .select('start_date, end_date')
      .eq('id', projectId)
      .is('deleted_at', null)
      .maybeSingle()
    if (projectError || !project) { res.status(404).json({ error: 'Proyecto no encontrado' }); return }

    const projectStart = project.start_date as string
    const projectEnd = (project.end_date as string | null) ?? null

    if (valid_from < projectStart) {
      res.status(400).json({ error: `La fecha de inicio no puede ser anterior al inicio del proyecto (${projectStart})` })
      return
    }
    if (projectEnd && valid_from > projectEnd) {
      res.status(400).json({ error: `La fecha de inicio no puede ser posterior al fin del proyecto (${projectEnd})` })
      return
    }
    if (typeof valid_to === 'string' && valid_to) {
      if (valid_to < valid_from) {
        res.status(400).json({ error: 'La fecha de fin no puede ser anterior a la fecha de inicio' })
        return
      }
      if (projectEnd && valid_to > projectEnd) {
        res.status(400).json({ error: `La fecha de fin no puede ser posterior al fin del proyecto (${projectEnd})` })
        return
      }
    }

    // Prevent duplicate active membership
    const { data: existing } = await supabase
      .from('project_assignment')
      .select('id')
      .eq('person_id', (person as { id: string }).id)
      .eq('project_id', projectId)
      .is('valid_to', null)
      .maybeSingle()
    if (existing) {
      res.status(409).json({ error: 'Ya estás participando en este proyecto' })
      return
    }

    const { data, error: insertError } = await supabase
      .from('project_assignment')
      .insert({
        person_id: (person as { id: string }).id,
        project_id: projectId,
        percentage: 100,
        valid_from,
        ...(typeof valid_to === 'string' && valid_to ? { valid_to } : {}),
      })
      .select()
      .single()

    if (insertError) throw new Error(insertError.message)
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
})

export { peopleRouter, projectsRouter }
