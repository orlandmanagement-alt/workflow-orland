import { Hono } from 'hono'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { AwsClient } from 'aws4fetch'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.post('/upload-url', requireRole(['admin', 'client', 'talent']), async (c) => {
  try {
    const { fileName, contentType, folder } = await c.req.json()
    
    // ==========================================
    // 1. KEAMANAN EKSTRA & VALIDASI INPUT
    // ==========================================
    if (!fileName || !contentType) {
        return c.json({ status: 'error', message: 'fileName dan contentType wajib dikirim' }, 400);
    }
    
    // Bersihkan nama file dari path aneh seperti ../ atau /
    const cleanFileName = fileName.replace(/^.*[\\\/]/, '').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    // Pastikan folder hanya masuk ke direktori yang diizinkan (Mencegah Directory Traversal)
    const safeFolder = (folder || 'misc').replace(/[^a-zA-Z0-9.\-_/]/g, '');
    
    const key = `${safeFolder}/${Date.now()}-${cleanFileName}`;
    
    // ==========================================
    // 2. PERSIAPAN CLOUDFLARE R2
    // ==========================================
    const accessKey = c.env.R2_ACCESS_KEY_ID;
    const secretKey = c.env.R2_SECRET_ACCESS_KEY;
    const accountId = c.env.CF_ACCOUNT_ID;
    const bucketName = c.env.R2_BUCKET_NAME || 'orland-media';

    if (!accessKey || !secretKey || !accountId) {
        return c.json({ status: 'error', message: 'Rahasia R2 belum lengkap' }, 500);
    }

    const r2 = new AwsClient({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      service: 's3',
      region: 'auto',
    });

    const url = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`);

    // ==========================================
    // 3. TANDA TANGAN URL (ANTI ERROR 403)
    // ==========================================
    // KUNCI UTAMA: Kita WAJIB memasukkan Content-Type dan UNSIGNED-PAYLOAD 
    // ke dalam Request ini agar ikut ditandatangani dan cocok dengan kiriman browser!
    const signed = await r2.sign(new Request(url, { 
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
            'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD'
        }
    }), {
      awsSigV4: { signQuery: true }
    });

    // Kirim URL yang sudah ditandatangani ke Frontend
    return c.json({
      status: 'ok',
      uploadUrl: signed.url,
      publicUrl: `https://cdn.orlandmanagement.com/media/${key}`,
      fileKey: key
    })

  } catch (error: any) {
      console.error("Presigned URL Error:", error);
      return c.json({ status: 'error', message: error.message }, 500);
  }
})

export default router