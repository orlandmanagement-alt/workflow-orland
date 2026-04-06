import { Hono } from 'hono'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.post('/upload-url', requireRole(['admin', 'client', 'talent']), async (c) => {
  try {
    const { fileName, contentType, folder } = await c.req.json()
    
    // Bersihkan nama file dari spasi
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `${folder || 'misc'}/${Date.now()}-${safeFileName}`;
    
    const accessKey = c.env.R2_ACCESS_KEY_ID;
    const secretKey = c.env.R2_SECRET_ACCESS_KEY;
    const accountId = c.env.CF_ACCOUNT_ID;
    const bucketName = c.env.R2_BUCKET_NAME || 'orland-media';

    if (!accessKey || !secretKey || !accountId) {
        return c.json({ status: 'error', message: 'Rahasia R2 di appapi belum lengkap' }, 500);
    }

    const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;

    // MENGGUNAKAN HELPER KUSTOM (Jauh lebih aman dari aws4fetch)
    const uploadUrl = await generatePresignedPutUrl({
      endpoint: r2Endpoint,
      key: key,
      contentType: contentType,
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      expiresInSeconds: 300
    });

    return c.json({
      status: 'ok',
      uploadUrl: uploadUrl,
      // URL Publik ini akan langsung dilayani oleh appcdn Anda!
      publicUrl: `https://cdn.orlandmanagement.com/media/${key}`,
      fileKey: key,
      headers: { 'Content-Type': contentType }
    })

  } catch (error: any) {
      console.error("Presigned URL Error:", error);
      return c.json({ status: 'error', message: error.message }, 500);
  }
})

// ─────────────────────────────────────────────
// 🔧 Helper: Generate Presigned PUT URL (AWS Sig V4)
// (Diimpor dari karya orisinal Anda di appcdn)
// ─────────────────────────────────────────────
async function generatePresignedPutUrl(opts: {
  endpoint: string
  key: string
  contentType: string
  accessKeyId: string
  secretAccessKey: string
  expiresInSeconds: number
}): Promise<string> {
  const { endpoint, key, contentType, accessKeyId, secretAccessKey, expiresInSeconds } = opts

  const url = new URL(`${endpoint}/${key}`)
  const date = new Date()
  const dateStr = date.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const dateShort = dateStr.slice(0, 8)
  const region = 'auto'
  const service = 's3'
  const scope = `${dateShort}/${region}/${service}/aws4_request`

  url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
  url.searchParams.set('X-Amz-Credential', `${accessKeyId}/${scope}`)
  url.searchParams.set('X-Amz-Date', dateStr)
  url.searchParams.set('X-Amz-Expires', String(expiresInSeconds))
  url.searchParams.set('X-Amz-SignedHeaders', 'content-type;host')
  url.searchParams.set('Content-Type', contentType)

  const host = url.hostname
  const canonicalRequest = [
    'PUT',
    `/${key}`,
    url.searchParams.toString(),
    `content-type:${contentType}\nhost:${host}\n`,
    'content-type;host',
    'UNSIGNED-PAYLOAD', // Kunci kesuksesan bypass!
  ].join('\n')

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateStr,
    scope,
    await sha256(canonicalRequest),
  ].join('\n')

  const signingKey = await getSigningKey(secretAccessKey, dateShort, region, service)
  const signature = await hmacHex(signingKey, stringToSign)
  url.searchParams.set('X-Amz-Signature', signature)

  return url.toString()
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmac(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
}

async function hmacHex(key: ArrayBuffer, message: string): Promise<string> {
  const result = await hmac(key, message)
  return Array.from(new Uint8Array(result)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function getSigningKey(secret: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmac(new TextEncoder().encode(`AWS4${secret}`), date)
  const kRegion = await hmac(kDate, region)
  const kService = await hmac(kRegion, service)
  return hmac(kService, 'aws4_request')
}

export default router