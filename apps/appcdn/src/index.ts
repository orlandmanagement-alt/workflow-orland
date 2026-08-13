import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { verify } from 'hono/jwt'

type Bindings = {
  ASSETS_BUCKET: R2Bucket
  JWT_SECRET: string
  CF_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
}

type Variables = {
  userId: string
  userRole: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// CORS — izinkan semua origin Orland
app.use('*', cors({
  origin: [
    'https://talent.orlandmanagement.com',
    'https://client.orlandmanagement.com',
    'https://admin.orlandmanagement.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['ETag'],
}))

// ─────────────────────────────────────────────
// 🔐 Auth Middleware (untuk endpoint upload-url)
// ─────────────────────────────────────────────
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ status: 'error', message: 'Unauthorized' }, 401)
  }
  try {
    const token = authHeader.split(' ')[1]
    const payload = await verify(token, c.env.JWT_SECRET || 'orland-rahasia-utama-123', 'HS256')
    c.set('userId', payload.sub as string)
    c.set('userRole', payload.role as string)
    await next()
  } catch {
    return c.json({ status: 'error', message: 'Token invalid atau kadaluarsa' }, 401)
  }
}

// ─────────────────────────────────────────────
// 🩺 Health Check
// ─────────────────────────────────────────────
app.get('/health', (c) =>
  c.json({
    status: 'online',
    service: 'Orland CDN / R2 Bridge',
    timestamp: new Date().toISOString(),
  })
)

// ─────────────────────────────────────────────
// 📤 POST /upload-url
// Generate Presigned URL untuk direct upload ke R2
// Body: { fileName: string, contentType: string, folder: 'talents'|'clients'|'kyc'|'misc' }
// Returns: { uploadUrl, publicUrl, fileKey, headers }
// ─────────────────────────────────────────────
app.post('/upload-url', requireAuth, async (c) => {
  const { fileName, contentType, folder = 'misc' } = await c.req.json()

  if (!fileName || !contentType) {
    return c.json({ status: 'error', message: 'fileName dan contentType wajib diisi' }, 400)
  }

  // Validate content type — hanya izinkan media
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm',
    'application/pdf',
  ]
  if (!allowedTypes.includes(contentType)) {
    return c.json({ status: 'error', message: `Content-Type tidak diizinkan: ${contentType}` }, 400)
  }

  const userId = c.get('userId')
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `${folder}/${userId}/${Date.now()}-${sanitizedName}`
  const bucketName = c.env.R2_BUCKET_NAME || 'orland-media'

  // ─── Generate Presigned URL via S3 Compatible API ───
  const r2Endpoint = `https://${c.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}`
  const uploadUrl = await generatePresignedPutUrl({
    endpoint: r2Endpoint,
    key,
    contentType,
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    expiresInSeconds: 300, // 5 menit
  })

  const publicUrl = `https://cdn.orlandmanagement.com/media/${key}`

  return c.json({
    status: 'ok',
    uploadUrl,
    publicUrl,
    fileKey: key,
    expiresIn: 300,
    headers: { 'Content-Type': contentType },
  })
})

// ─────────────────────────────────────────────
// 📥 GET /media/:key{.+}
// Serve file dari R2 secara publik (tanpa auth)
// ─────────────────────────────────────────────
app.get('/media/:key{.+}', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.ASSETS_BUCKET.get(key)

  if (!object) {
    return c.json({ status: 'error', message: 'File tidak ditemukan' }, 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('ETag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('X-Content-Type-Options', 'nosniff')

  return new Response(object.body, { headers })
})

// ─────────────────────────────────────────────
// 🗑️ DELETE /media/:key{.+} (Admin only)
// Hapus file dari R2
// ─────────────────────────────────────────────
app.delete('/media/:key{.+}', requireAuth, async (c) => {
  const userRole = c.get('userRole')
  if (!['admin', 'talent', 'client'].includes(userRole)) {
    return c.json({ status: 'error', message: 'Akses ditolak' }, 403)
  }

  const key = c.req.param('key')
  await c.env.ASSETS_BUCKET.delete(key)

  return c.json({ status: 'ok', message: `File ${key} berhasil dihapus` })
})

// ─────────────────────────────────────────────
// 🔧 Helper: Generate Presigned PUT URL (AWS Sig V4)
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
    'UNSIGNED-PAYLOAD',
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

export default app
