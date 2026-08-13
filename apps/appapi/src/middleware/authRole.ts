import { Context, Next } from 'hono'

// Middleware untuk mencocokkan Role dari JWT
export const requireRole = (allowedRoles: string[]) => {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole')
    
    // Superadmin bypass (Bisa mengakses semuanya)
    if (userRole === 'superadmin') return await next()
    
    if (!allowedRoles.includes(userRole)) {
      return c.json({ status: 'error', message: `Akses ditolak. Dibutuhkan role: ${allowedRoles.join(' atau ')}.` }, 403)
    }
    await next()
  }
}

// Middleware untuk "Must be Resource Owner or Admin"
// Asumsi: Entitas yang diminta (misal talent_id atau client_id) dikirim via parameter URL
export const requireOwnerOrAdmin = (paramName: string) => {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole')
    const userId = c.get('userId')
    const resourceId = c.req.param(paramName)
    
    if (userRole === 'admin' || userRole === 'superadmin') return await next()
    
    // Jika bukan admin, pastikan ID di param sama dengan ID di JWT
    if (userId !== resourceId) {
       return c.json({ status: 'error', message: 'Akses ditolak. Anda bukan pemilik data ini.' }, 403)
    }
    await next()
  }
}
