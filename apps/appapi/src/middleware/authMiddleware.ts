/**
 * Authentication and Authorization Middleware for Hono.js
 * Optimized for Orland Management Enterprise SaaS
 */

import { Context, Next } from 'hono';

/**
 * Middleware dasar untuk memastikan user sudah login.
 * Mengambil data dari context yang disiapkan oleh middleware global di index.ts
 */
export async function requireAuth(c: Context, next: Next) {
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json({ 
      status: 'error', 
      message: 'Unauthorized: Sesi tidak ditemukan atau telah berakhir' 
    }, 401);
  }
  
  await next();
}

/**
 * Middleware khusus untuk fitur Premium
 */
export async function requirePremium(c: Context, next: Next) {
  const userTier = c.get('userTier') || 'free';
  
  if (userTier !== 'premium') {
    return c.json({ 
      status: 'error', 
      message: 'Forbidden: Fitur ini hanya tersedia untuk akun Premium' 
    }, 403);
  }
  
  await next();
}

/**
 * Middleware khusus Admin
 */
export async function requireAdmin(c: Context, next: Next) {
  const userRole = c.get('userRole');
  
  if (userRole !== 'admin') {
    return c.json({ 
      status: 'error', 
      message: 'Forbidden: Akses ditolak. Hanya untuk Administrator' 
    }, 403);
  }
  
  await next();
}

/**
 * Middleware untuk Agency atau Admin
 */
export async function requireAgencyOrAdmin(c: Context, next: Next) {
  const userRole = c.get('userRole');
  
  if (userRole !== 'agency' && userRole !== 'admin') {
    return c.json({ 
      status: 'error', 
      message: 'Forbidden: Akses ditolak. Diperlukan peran Agency atau Admin' 
    }, 403);
  }
  
  await next();
}

/**
 * Middleware khusus Talent
 */
export async function requireTalent(c: Context, next: Next) {
  const userRole = c.get('userRole');
  
  if (userRole !== 'talent') {
    return c.json({ 
      status: 'error', 
      message: 'Forbidden: Akses khusus untuk Talent' 
    }, 403);
  }
  
  await next();
}

/**
 * Middleware JWT Legacy / Placeholder
 * Tetap dipertahankan jika Anda ingin melakukan ekstraksi token manual
 */
export async function authWithJWT(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ 
      status: 'error', 
      message: 'Unauthorized: Token tidak valid' 
    }, 401);
  }
  
  const token = authHeader.substring(7);
  // Simpan token ke context jika diperlukan oleh service lain
  c.set('token', token);
  
  await next();
}