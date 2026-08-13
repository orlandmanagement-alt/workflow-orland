import { Hono } from 'hono'
import { requireRole } from '../../middleware/authRole'
import { Bindings, Variables } from '../../index'

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>()

router.post('/upload-url', requireRole(['admin', 'client', 'talent']), async (c) => {
  try {
    const { fileName, contentType, folder } = await c.req.json()
    
    if (!fileName || !contentType) {
        return c.json({ status: 'error', message: 'fileName dan contentType wajib dikirim' }, 400);
    }
    
    // Bersihkan nama file agar URL aman
    const cleanFileName = fileName.replace(/^.*[\\\/]/, '').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const safeFolder = (folder || 'misc').replace(/\.\./g, '').replace(/[^a-zA-Z0-9.\-_/]/g, '');
    const key = `${safeFolder}/${Date.now()}-${cleanFileName}`;
    
    const accessKey = c.env.R2_ACCESS_KEY_ID;
    const secretKey = c.env.R2_SECRET_ACCESS_KEY;
    const accountId = c.env.CF_ACCOUNT_ID;
    const bucketName = c.env.R2_BUCKET_NAME || 'orland-media';

    if (!accessKey || !secretKey || !accountId) {
        return c.json({ status: 'error', message: 'Rahasia R2 belum lengkap' }, 500);
    }

    const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;

    // MENGGUNAKAN ENGINE MANUAL YANG 100% AMAN DARI ERROR 400
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
      publicUrl: `https://cdn.orlandmanagement.com/media/${key}`,
      fileKey: key
    })

  } catch (error: any) {
      return c.json({ status: 'error', message: error.message }, 500);
  }
})

// ─────────────────────────────────────────────
// 🔧 ENGINE: Generate Presigned PUT URL (Bypass Error 400)
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

  // Parameter Wajib disusun sesuai urutan Alfabet!
  url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
  url.searchParams.set('X-Amz-Credential', `${accessKeyId}/${scope}`)
  url.searchParams.set('X-Amz-Date', dateStr)
  url.searchParams.set('X-Amz-Expires', String(expiresInSeconds))
  url.searchParams.set('X-Amz-SignedHeaders', 'content-type;host') // TIDAK ADA x-amz-content-sha256 di sini

  const host = url.hostname
  
  // URI harus mencakup bucket name (url.pathname) bukan hanya key, dan di-encode per RFC 3986.
  const canonicalUri = url.pathname.split('/').map(c => encodeURIComponent(c)).join('/');
  
  // Amankan format Query String Sesuai strict standard AWS V4 (Alphabetical + URL Encoded)
  const canonicalQuery = Array.from(url.searchParams.entries())
    .sort(([k1], [k2]) => k1.localeCompare(k2))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuery,
    `content-type:${contentType}\nhost:${host}\n`,
    'content-type;host',
    'UNSIGNED-PAYLOAD', // Di sinilah keajaiban itu terjadi, tanpa dikirim sebagai Header!
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