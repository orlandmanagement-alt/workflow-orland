// File: apps/appapi/src/middleware/agencyImpersonationMiddleware.ts

import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'

/**
 * [MIDDLEWARE] Hono Agency Impersonation
 * Mendeteksi jika Request menggunakan Token Impersonation.
 * Jika valid, sistem akan menimpa (override) Context seolah-olah yang mengakses adalah Talent.
 */
export const agencyImpersonationMiddleware = async (c: Context, next: Next) => {
  // 1. Tangkap token dari header Authorization
  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (token) {
    try {
      const secret = c.env.JWT_SECRET || 'orland_fallback_secret_999';
      
      // 2. Verifikasi Token
      const decoded = await verify(token, secret);

      // 3. Cek apakah ini token ajaib (impersonation)
      if (decoded.type === 'impersonation' && decoded.agency_id && decoded.impersonator_id) {
        
        // =========================================================
        // OVERRIDE CONTEXT: Jadikan request ini sebagai Talent Asli
        // =========================================================
        c.set('userId', decoded.sub); // Set ID Talent
        c.set('userRole', 'talent');  // Set Role sebagai Talent
        
        // 4. (Opsional) Simpan jejak audit jika Anda butuh tracking
        // Bahwa talent ini sedang dikendalikan oleh Agensi
        c.set('isImpersonating', true);
        c.set('impersonatorAgencyId', decoded.agency_id);
      }
    } catch (e) {
      // Jika token expired/invalid, kita abaikan saja.
      // Biarkan middleware otentikasi utama (sessionValidation.ts) yang memblokir aksesnya.
    }
  }

  // Lanjut ke proses berikutnya
  await next();
}