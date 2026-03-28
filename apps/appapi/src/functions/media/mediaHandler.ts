import { Hono } from 'hono'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'
import { AwsClient } from 'aws4fetch' // Library standar untuk S3/R2 di Workers

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Generate Presigned URL untuk Upload Langsung ke R2
router.post('/upload-url', requireRole(['admin', 'client', 'talent']), async (c) => {
  const { fileName, contentType, folder } = await c.req.json()
  const key = `${folder || 'misc'}/${Date.now()}-${fileName}`
  
  // Konfigurasi R2 (S3 Compatible)
  const r2 = new AwsClient({
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  })

  const url = new URL(`https://${c.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com/${c.env.R2_MEDIA.name}/${key}`)
  
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
    publicUrl: `https://api.orlandmanagement.com/api/v1/public/media/${key}`,
    fileKey: key,
    headers: { 'Content-Type': contentType }
  })
})

export default router
