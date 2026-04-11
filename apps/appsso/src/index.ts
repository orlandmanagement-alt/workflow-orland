import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authEnhancedRoutes from './routes/auth-enhanced' // Load sistem baru
import authRoutes from './routes/auth'                   // Load sistem lama untuk OTP/PIN

type Bindings = { DB_SSO: D1Database; JWT_SECRET: string; }
const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: (origin) => origin || 'https://talent.orlandmanagement.com',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept'],
  credentials: true,
  maxAge: 86400,
}))

// PENTING: Mount yang enhanced lebih dulu agar /login dan /register menggunakan sistem PBKDF2/Rate-limit
app.route('/api/auth', authEnhancedRoutes)

// Mount sistem lama untuk menangani /setup-pin, /request-otp, /reset-password, dll
app.route('/api/auth', authRoutes)

export default app