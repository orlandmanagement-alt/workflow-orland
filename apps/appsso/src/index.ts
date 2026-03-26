import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth'

type Bindings = { DB_SSO: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

// Translasi _middleware.js (CORS Dinamis)
app.use('*', cors({
  origin: (origin) => origin || 'https://talent.orlandmanagement.com',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept'],
  credentials: true,
  maxAge: 86400,
}))

// Mount API Otentikasi
app.route('/api/auth', authRoutes)

export default app
