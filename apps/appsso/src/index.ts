import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authEnhancedRoutes from './routes/auth-enhanced'

type Bindings = { DB_SSO: D1Database; JWT_SECRET: string; }
const app = new Hono<{ Bindings: Bindings }>()

// 1. Buat daftar semua domain frontend yang diizinkan mengakses SSO
const allowedOrigins = [
  'https://talent.orlandmanagement.com',
  'https://client.orlandmanagement.com',
  'https://admin.orlandmanagement.com',
  'https://agency.orlandmanagement.com',
  'https://sso.orlandmanagement.com',
  'https://www.orlandmanagement.com', // 👈 TAMBAHKAN INI (Dengan www)
  'https://orlandmanagement.com',     // 👈 TAMBAHKAN INI (Tanpa www)
  'http://localhost:5173'
];

// 2. Terapkan konfigurasi CORS Dinamis
app.use('*', cors({
  origin: (origin) => {
    // Jika origin (sumber request) ada di dalam daftar kita, izinkan.
    // Jika tidak ada (atau request dari server/Postman), gunakan fallback default.
    if (origin && allowedOrigins.includes(origin)) {
      return origin;
    }
    return allowedOrigins[0]; // Fallback aman
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept'],
  credentials: true, // Wajib true agar Cookie (sid) bisa dikirim & disimpan di browser
  maxAge: 86400, // Cache izin CORS selama 24 jam agar lebih cepat
}))

app.route('/api/auth', authEnhancedRoutes)

export default app