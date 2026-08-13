import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createNoteSchema } from './talentSchemas'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.get('/:talent_id/internal-notes', async (c) => {
  if (c.get('userRole') !== 'admin') return c.json({ status: 'error', message: 'Forbidden' }, 403)
  const { results } = await c.env.DB_CORE.prepare('SELECT * FROM talent_internal_notes WHERE talent_id = ?').bind(c.req.param('talent_id')).all()
  return c.json({ status: 'ok', data: results || [] })
})

router.post('/:talent_id/internal-notes', zValidator('json', createNoteSchema), async (c) => {
  if (c.get('userRole') !== 'admin') return c.json({ status: 'error', message: 'Forbidden' }, 403)
  const body = c.req.valid('json')
  const noteId = crypto.randomUUID()
  
  await c.env.DB_CORE.prepare('INSERT INTO talent_internal_notes (note_id, talent_id, author_user_id, note_text) VALUES (?, ?, ?, ?)')
    .bind(noteId, c.req.param('talent_id'), c.get('userId'), body.note_text).run()
  return c.json({ status: 'ok', id: noteId }, 201)
})
export default router
