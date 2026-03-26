import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { fileMetaSchema, reorderSchema } from './mediaSchemas'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
// Membutuhkan npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Helper untuk inisiasi R2 Client (Membutuhkan R2_ACCESS_KEY_ID & R2_SECRET_ACCESS_KEY di Secrets)
const getR2Client = (env: any) => new S3Client({
  region: 'auto',
  endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY }
})

router.post('/upload-url', requireRole(['admin', 'talent']), zValidator('json', fileMetaSchema), async (c) => {
  const body = c.req.valid('json')
  const talentId = c.get('userId')
  const mediaId = crypto.randomUUID()
  
  // Format nama file: talent_id/media_id.ekstensi
  const ext = body.file_name.split('.').pop()
  const objectKey = `talents/${talentId}/${mediaId}.${ext}`
  
  try {
    const s3 = getR2Client(c.env)
    const command = new PutObjectCommand({ Bucket: c.env.R2_MEDIA.bucket, Key: objectKey, ContentType: body.file_type })
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }) // Berlaku 1 Jam
    
    // Catat ke DB (is_primary = 0)
    const publicUrl = `https://cdn.orlandmanagement.com/${objectKey}`
    await c.env.DB_CORE.prepare('INSERT INTO talent_media (media_id, talent_id, media_url, media_type, is_primary) VALUES (?, ?, ?, ?, 0)')
      .bind(mediaId, talentId, publicUrl, body.file_type).run()
      
    return c.json({ status: 'ok', upload_url: presignedUrl, media_id: mediaId, public_url: publicUrl }, 201)
  } catch (e) {
    return c.json({ status: 'error', message: 'Gagal men-generate URL Upload' }, 500)
  }
})

router.put('/:media_id/set-primary', requireRole(['admin', 'talent']), async (c) => {
  const mediaId = c.req.param('media_id')
  const talentId = c.get('userId') // Asumsi yang mengubah adalah pemiliknya
  
  // D1 Batch Execution: Reset semua ke 0, lalu set yang dipilih ke 1
  const batch = await c.env.DB_CORE.batch([
    c.env.DB_CORE.prepare('UPDATE talent_media SET is_primary = 0 WHERE talent_id = ?').bind(talentId),
    c.env.DB_CORE.prepare('UPDATE talent_media SET is_primary = 1 WHERE media_id = ? AND talent_id = ?').bind(mediaId, talentId)
  ])
  
  if (batch[1].meta.changes === 0) return c.json({ status: 'error', message: 'Media tidak ditemukan' }, 404)
  return c.json({ status: 'ok', message: 'Foto utama berhasil diperbarui' })
})

router.put('/reorder', requireRole(['admin', 'talent']), zValidator('json', reorderSchema), async (c) => {
  const body = c.req.valid('json')
  const statements = body.media_ids.map((id, index) => 
    c.env.DB_CORE.prepare('UPDATE talent_media SET sort_order = ? WHERE media_id = ?').bind(index, id)
  )
  
  await c.env.DB_CORE.batch(statements)
  return c.json({ status: 'ok', message: 'Urutan diperbarui' })
})

export default router
