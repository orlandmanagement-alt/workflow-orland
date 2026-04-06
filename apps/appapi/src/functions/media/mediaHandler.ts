import { Hono } from 'hono'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { AwsClient } from 'aws4fetch' // Library standar untuk S3/R2 di Workers

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Generate Presigned URL untuk Upload Langsung ke R2
router.post('/upload-url', requireRole(['admin', 'client', 'talent']), async (c) => {
  try {
    const { fileName, contentType, folder } = await c.req.json()
    const key = `${folder || 'misc'}/${Date.now()}-${fileName}`
    
    // Ambil variabel dari Environment (Cloudflare Settings)
    const accessKey = c.env.R2_ACCESS_KEY_ID;
    const secretKey = c.env.R2_SECRET_ACCESS_KEY;
    const accountId = c.env.CF_ACCOUNT_ID;
    const bucketName = c.env.R2_BUCKET_NAME || 'orland-media'; // Perbaikan Error .name

    // Proteksi jika variabel belum diisi di dashboard Cloudflare
    if (!accessKey || !secretKey || !accountId) {
        return c.json({ 
            status: 'error', 
            message: 'Konfigurasi Rahasia R2 (Access Key/Account ID) di Worker appapi belum lengkap.' 
        }, 500);
    }

    // Konfigurasi R2 (S3 Compatible)
    const r2 = new AwsClient({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      service: 's3',
      region: 'auto',
    })

    const url = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`)
    
    // Generate URL yang diizinkan untuk method PUT
    const signedRequest = await r2.sign(
      new Request(url, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
      }),
      { awsSigV4: { expiration: 300 } } // Berlaku 5 menit
    )

    return c.json({
      status: 'ok',
      uploadUrl: signedRequest.url,
      // Perbaikan: publicUrl diarahkan ke CDN yang sudah kita buat sebelumnya
      publicUrl: `https://cdn.orlandmanagement.com/media/${key}`,
      fileKey: key,
      headers: { 'Content-Type': contentType }
    })

  } catch (error: any) {
      console.error("Presigned URL Error:", error);
      return c.json({ 
          status: 'error', 
          message: error.message || 'Sistem gagal memproses tautan R2.' 
      }, 500);
  }
})

export default router