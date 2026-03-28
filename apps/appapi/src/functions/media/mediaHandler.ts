import { Hono } from 'hono'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// MENGAMBIL DAFTAR MEDIA
router.get('/', async (c) => {
  const userId = c.get('userId')
  try {
    const media = await c.env.DB_CORE.prepare('SELECT * FROM media WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all()
    return c.json({ status: 'ok', data: media.results })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

// MENGUNGGAH FILE KE CLOUDFLARE R2
router.post('/', async (c) => {
  const userId = c.get('userId')
  try {
    const body = await c.req.parseBody()
    const file = body['file'] as File
    
    if (!file) return c.json({ status: 'error', message: 'File tidak ditemukan' }, 400)

    // Buat nama file unik agar tidak bertabrakan
    const fileExt = file.name.split('.').pop()
    const uniqueFileName = `${userId}-${Date.now()}.${fileExt}`
    const mediaId = crypto.randomUUID()
    
    // 1. Simpan fisik file ke Cloudflare R2 Bucket
    await c.env.R2_MEDIA.put(uniqueFileName, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type }
    })

    // 2. Rangkai URL Publik (mengarah ke route public yang kita buat di index.ts)
    const url = new URL(c.req.url)
    const publicUrl = `${url.origin}/api/v1/public/media/${uniqueFileName}`

    // 3. Simpan catatan ke Database D1
    const fileType = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE';
    await c.env.DB_CORE.prepare(
      `INSERT INTO media (media_id, user_id, filename, url, type, is_main) VALUES (?, ?, ?, ?, ?, 0)`
    ).bind(mediaId, userId, file.name, publicUrl, fileType).run()

    return c.json({ status: 'ok', message: 'Upload berhasil ke R2!', url: publicUrl })
  } catch (err: any) {
    console.error("R2 Upload Error:", err)
    return c.json({ status: 'error', message: 'Gagal mengunggah ke Cloudflare R2' }, 500)
  }
})

// MENJADIKAN SAMPUL UTAMA (Comp Card Cover)
router.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const mediaId = c.req.param('id')
  try {
    // Turunkan jabatan semua foto menjadi 0
    await c.env.DB_CORE.prepare('UPDATE media SET is_main = 0 WHERE user_id = ?').bind(userId).run()
    // Naikkan jabatan foto yang dipilih menjadi 1
    await c.env.DB_CORE.prepare('UPDATE media SET is_main = 1 WHERE media_id = ? AND user_id = ?').bind(mediaId, userId).run()
    return c.json({ status: 'ok' })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

// MENGHAPUS MEDIA DARI DB & R2
router.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const mediaId = c.req.param('id')
  try {
    const media = await c.env.DB_CORE.prepare('SELECT url FROM media WHERE media_id = ? AND user_id = ?').bind(mediaId, userId).first()
    if (media && media.url) {
        // Ekstrak nama file dari URL
        const fileName = (media.url as string).split('/').pop()
        if(fileName) await c.env.R2_MEDIA.delete(fileName) // Hapus fisik dari R2
    }
    // Hapus dari Database
    await c.env.DB_CORE.prepare('DELETE FROM media WHERE media_id = ? AND user_id = ?').bind(mediaId, userId).run()
    return c.json({ status: 'ok' })
  } catch (err: any) {
    return c.json({ status: 'error', message: err.message }, 500)
  }
})

export default router
