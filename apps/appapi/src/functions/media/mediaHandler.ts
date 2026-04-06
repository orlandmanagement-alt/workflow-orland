import { Hono } from 'hono'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { AwsClient } from 'aws4fetch'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.post('/upload-url', requireRole(['admin', 'client', 'talent']), async (c) => {
  try {
    const { fileName, contentType, folder } = await c.req.json()
    
    // 1. Bersihkan nama file dari spasi agar URL tidak rusak
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `${folder || 'misc'}/${Date.now()}-${safeFileName}`;
    
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
    })

    const url = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`)
    
    // 2. KUNCI PERBAIKAN: Beri tahu R2 bahwa isi file tidak ikut ditandatangani (UNSIGNED-PAYLOAD)
    const signedRequest = await r2.sign(
      new Request(url, {
        method: 'PUT',
        headers: { 
            'Content-Type': contentType,
            'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD' // <--- INI PENYELAMATNYA
        },
      }),
      { awsSigV4: { expiration: 300 } }
    )

    return c.json({
      status: 'ok',
      uploadUrl: signedRequest.url,
      // 3. ALUR URL: Menggunakan Custom Domain cdn.orlandmanagement.com
      publicUrl: `https://cdn.orlandmanagement.com/media/${key}`,
      fileKey: key,
      headers: { 'Content-Type': contentType }
    })

  } catch (error: any) {
      console.error("Presigned URL Error:", error);
      return c.json({ status: 'error', message: error.message }, 500);
  }
})

export default router