/**
 * Authentication and Authorization Middleware for Hono.js
 */

import { Context, Next } from 'hono';

/**
 * Middleware to check if user is authenticated
 */
export async function requireAuth(c: Context, next: Next) {
  const userId = c.req.header('x-user-id');
  const userRole = c.req.header('x-user-role');
  const userTier = c.req.header('x-user-tier') || 'free';
  
  if (!userId) {
    return c.json({ error: 'Unauthorized: User ID not found' }, 401);
  }
  
  // Attach to context
  c.set('userId', userId);
  c.set('userRole', userRole || 'talent');
  c.set('userTier', userTier);
  
  await next();
}

/**
 * Middleware to check if user is Premium tier
 */
export async function requirePremium(c: Context, next: Next) {
  const userTier = c.req.header('x-user-tier') || 'free';
  
  if (userTier !== 'premium') {
    return c.json({ error: 'Forbidden: Premium access required' }, 403);
  }
  
  await next();
}

/**
 * Middleware to check if user is Admin
 */
export async function requireAdmin(c: Context, next: Next) {
  const userRole = c.req.header('x-user-role');
  
  if (userRole !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  
  c.set('userRole', userRole);
  await next();
}

/**
 * Middleware to check if user is Agency or Admin
 */
export async function requireAgencyOrAdmin(c: Context, next: Next) {
  const userRole = c.req.header('x-user-role');
  
  if (userRole !== 'agency' && userRole !== 'admin') {
    return c.json({ error: 'Forbidden: Agency or Admin access required' }, 403);
  }
  
  c.set('userRole', userRole);
  await next();
}

/**
 * Middleware to check if user is Talent
 */
export async function requireTalent(c: Context, next: Next) {
  const userRole = c.req.header('x-user-role');
  const userId = c.req.header('x-user-id');
  
  if (userRole !== 'talent') {
    return c.json({ error: 'Forbidden: Talent access required' }, 403);
  }
  
  c.set('userId', userId);
  c.set('userRole', userRole);
  await next();
}

/**
 * Middleware to extract and validate JWT token (if using JWT)
 */
export async function authWithJWT(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  // TODO: Validate JWT token and extract claims
  // const decoded = await verifyJWT(token);
  
  // For now, treat the token as user ID (placeholder)
  c.set('token', token);
  
  await next();
}
