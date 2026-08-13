import { Hono } from 'hono';
import { requireRole } from '../../middleware/authRole';
import { Bindings, Variables } from '../../index';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ─────────────────────────────────────────────
// POST /tools/comms/whatsapp/blast
// Kirim pesan WhatsApp blast ke daftar penerima
// Body: { recipients: string[], message: string, template_id?: string }
// ─────────────────────────────────────────────
router.post('/whatsapp/blast', requireRole(['admin', 'superadmin']), async (c) => {
  const body = await c.req.json();
  const { recipients, message, template_id } = body;

  if (!recipients?.length || !message) {
    return c.json({ status: 'error', message: 'recipients dan message wajib diisi' }, 400);
  }

  // Catat log blast di DB
  const blastId = crypto.randomUUID();
  await c.env.DB_LOGS.prepare(
    'INSERT INTO comms_logs (id, type, recipient_count, message_preview, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    blastId,
    'whatsapp',
    recipients.length,
    message.slice(0, 100),
    'queued',
    c.get('userId'),
    new Date().toISOString()
  ).run();

  if (c.env.FONNTE_TOKEN) {
    try {
      const res = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': c.env.FONNTE_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: recipients.join(','), message, delay: 2 })
      });
      if(res.ok) {
         await c.env.DB_LOGS.prepare('UPDATE comms_logs SET status = ? WHERE id = ?').bind('sent', blastId).run();
      }
    } catch(err) {
      await c.env.DB_LOGS.prepare('UPDATE comms_logs SET status = ? WHERE id = ?').bind('failed', blastId).run();
    }
  }

  return c.json({
    status: 'ok',
    blast_id: blastId,
    queued_count: recipients.length,
    message: `Blast WA ke ${recipients.length} penerima dijadwalkan via Fonnte.`,
  }, 201);
});

// ─────────────────────────────────────────────
// POST /tools/comms/email/newsletters
// Kirim email blast / newsletter ke penerima
// Body: { to?: string[], segment?: 'all_talents'|'all_clients'|'all', subject: string, html_body: string }
// ─────────────────────────────────────────────
router.post('/email/newsletters', requireRole(['admin', 'superadmin']), async (c) => {
  const body = await c.req.json();
  const { subject, html_body, segment = 'all', to } = body;

  if (!subject || !html_body) {
    return c.json({ status: 'error', message: 'subject dan html_body wajib diisi' }, 400);
  }

  // Resolusi penerima berdasarkan segment
  let recipientCount = to?.length ?? 0;
  if (!to?.length) {
    const segmentMap: Record<string, string> = {
      all_talents: 'SELECT email FROM users WHERE role = \'talent\' AND is_active = 1',
      all_clients: 'SELECT email FROM users WHERE role = \'client\' AND is_active = 1',
      all: 'SELECT email FROM users WHERE is_active = 1',
    };
    const query = segmentMap[segment] ?? segmentMap['all'];
    const result = await c.env.DB_SSO.prepare(`SELECT COUNT(*) as total FROM (${query})`).first<{ total: number }>();
    recipientCount = result?.total ?? 0;
  }

  // Catat log di DB
  const newsletterId = crypto.randomUUID();
  await c.env.DB_LOGS.prepare(
    'INSERT INTO comms_logs (id, type, recipient_count, message_preview, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    newsletterId,
    'email',
    recipientCount,
    subject,
    'queued',
    c.get('userId'),
    new Date().toISOString()
  ).run();

  if (c.env.RESEND_API_KEY) {
    // Get actual emails if not provided
    let emails = to || [];
    if (!to?.length && recipientCount > 0) {
       const segmentMap: Record<string, string> = {
          all_talents: 'SELECT email FROM users WHERE role = \'talent\' AND is_active = 1',
          all_clients: 'SELECT email FROM users WHERE role = \'client\' AND is_active = 1',
          all: 'SELECT email FROM users WHERE is_active = 1',
       };
       const query = segmentMap[segment] ?? segmentMap['all'];
       const { results } = await c.env.DB_SSO.prepare(query).all<{ email: string }>();
       emails = results.map(r => r.email);
    }
    
    if (emails.length > 0) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${c.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'noreply@orlandmanagement.com', to: emails, subject, html: html_body })
        });
        if(res.ok) {
           await c.env.DB_LOGS.prepare('UPDATE comms_logs SET status = ? WHERE id = ?').bind('sent', newsletterId).run();
        }
      } catch (err) {
        await c.env.DB_LOGS.prepare('UPDATE comms_logs SET status = ? WHERE id = ?').bind('failed', newsletterId).run();
      }
    }
  }

  return c.json({
    status: 'ok',
    newsletter_id: newsletterId,
    recipient_count: recipientCount,
    segment,
    message: `Newsletter dikirim ke ${recipientCount} penerima via Resend.`,
  }, 201);
});

// ─────────────────────────────────────────────
// GET /tools/comms/logs
// Riwayat blast/newsletter
// ─────────────────────────────────────────────
router.get('/logs', requireRole(['admin', 'superadmin']), async (c) => {
  const limit = parseInt(c.req.query('limit') ?? '20');
  const type = c.req.query('type');

  const query = type
    ? 'SELECT * FROM comms_logs WHERE type = ? ORDER BY created_at DESC LIMIT ?'
    : 'SELECT * FROM comms_logs ORDER BY created_at DESC LIMIT ?';

  const stmt = type
    ? c.env.DB_LOGS.prepare(query).bind(type, limit)
    : c.env.DB_LOGS.prepare(query).bind(limit);

  const result = await stmt.all();

  return c.json({ status: 'ok', data: result.results ?? [] });
});

export default router;
