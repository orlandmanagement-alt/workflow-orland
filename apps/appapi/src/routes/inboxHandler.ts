import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../../middleware/authRole'
import { sanitizeMessage } from '../../utils/wordFilter'
import { sendNotification } from '../../utils/notifier'
import { applyContactMasking, isRequesterAuthorized } from '../../utils/maskingUtils'

const router = new Hono<any>()

// ========================================================
// 1. GET SEMUA THREAD (Bisa diakses Client, Talent, Agency)
// ========================================================
router.get('/', requireRole(['client', 'talent', 'agency', 'admin']), async (c) => {
  const userId = c.get('userId')
  const role = c.get('userRole')
  
  let query = '';
  let params = [];

  if (role === 'client') {
     const client = await c.env.DB_CORE.prepare('SELECT client_id FROM clients WHERE user_id = ?').bind(userId).first();
     query = `
        SELECT it.*, p.title as project_title, t.fullname as talent_name, t.headshot_url
        FROM inbox_threads it
        JOIN projects p ON it.project_id = p.project_id
        JOIN talent_profiles t ON it.talent_id = t.talent_id
        WHERE it.client_id = ? ORDER BY it.created_at DESC
     `;
     params = [client.client_id];
  } 
  else if (role === 'talent') {
     const talent = await c.env.DB_CORE.prepare('SELECT talent_id FROM talent_profiles WHERE talent_id = ?').bind(userId).first();
     query = `
        SELECT it.*, p.title as project_title, c.company_name as client_name
        FROM inbox_threads it
        JOIN projects p ON it.project_id = p.project_id
        JOIN clients c ON it.client_id = c.client_id
        WHERE it.talent_id = ? AND it.agency_id IS NULL ORDER BY it.created_at DESC
     `;
     params = [talent.talent_id];
  }
  else if (role === 'agency') {
     const agency = await c.env.DB_CORE.prepare('SELECT client_id FROM clients WHERE user_id = ?').bind(userId).first();
     query = `
        SELECT it.*, p.title as project_title, c.company_name as client_name, t.fullname as talent_name
        FROM inbox_threads it
        JOIN projects p ON it.project_id = p.project_id
        JOIN clients c ON it.client_id = c.client_id
        JOIN talent_profiles t ON it.talent_id = t.talent_id
        WHERE it.agency_id = ? ORDER BY it.created_at DESC
     `;
     params = [agency.client_id];
  }

  const { results } = await c.env.DB_CORE.prepare(query).bind(...params).all();
  return c.json({ status: 'ok', data: results });
})

// ========================================================
// 2. KIRIM PESAN BARU (Dengan Sensor Kata Kasar)
// ========================================================
router.post('/:threadId/messages', requireRole(['client', 'talent', 'agency']), async (c) => {
  const threadId = c.req.param('threadId');
  const userId = c.get('userId');
  const body = await c.req.json();

  if (!body.message) return c.json({ status: 'error', message: 'Pesan kosong' }, 400);

  // 1. Sanitasi Pesan (Sensor No HP, Email, dan Kata Kasar)
  const cleanMessage = sanitizeMessage(body.message);

  // 2. Simpan ke Database
  const messageId = crypto.randomUUID();
  await c.env.DB_CORE.prepare(
    'INSERT INTO inbox_messages (message_id, thread_id, sender_id, message_text) VALUES (?, ?, ?, ?)'
  ).bind(messageId, threadId, userId, cleanMessage).run();

  // 3. (Opsional) Kirim Email/WA Notifikasi via notifier.ts ke pihak lawan
  // sendNotification(c.env, { to: recipientEmail, type: 'email', message: 'Anda mendapat pesan baru di Orland Inbox.' });

  return c.json({ status: 'ok', message: 'Pesan terkirim', data: { clean_text: cleanMessage } });
})

// ========================================================
// 3. MULAI PERCAKAPAN DARI SHORTLIST (Khusus Client)
// ========================================================
router.post('/start', requireRole(['client']), async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { project_id, talent_id, initial_message } = body;

  const client = await c.env.DB_CORE.prepare('SELECT client_id FROM clients WHERE user_id = ?').bind(userId).first();

  // Cek apakah talent ini dikelola oleh agensi
  const managed = await c.env.DB_CORE.prepare('SELECT agency_id FROM agency_talents WHERE talent_id = ?').bind(talent_id).first();
  const agencyId = managed ? managed.agency_id : null;

  // Buat Thread Baru
  const threadId = crypto.randomUUID();
  await c.env.DB_CORE.prepare(
    'INSERT INTO inbox_threads (thread_id, project_id, client_id, talent_id, agency_id) VALUES (?, ?, ?, ?, ?)'
  ).bind(threadId, project_id, client.client_id, talent_id, agencyId).run();

  // Masukkan Pesan Pertama
  if (initial_message) {
    const cleanMessage = sanitizeMessage(initial_message);
    await c.env.DB_CORE.prepare(
      'INSERT INTO inbox_messages (message_id, thread_id, sender_id, message_text, is_system_message) VALUES (?, ?, ?, ?, 0)'
    ).bind(crypto.randomUUID(), threadId, userId, cleanMessage).run();
  }

  return c.json({ status: 'ok', thread_id: threadId });
})

export default router