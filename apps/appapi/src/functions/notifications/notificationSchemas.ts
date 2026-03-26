import { z } from 'zod'
export const notifQuerySchema = z.object({ limit: z.string().optional().default('50'), offset: z.string().optional().default('0') })
export const broadcastSchema = z.object({ 
  title: z.string().min(3), 
  message: z.string().min(5), 
  audience: z.enum(['all', 'talents', 'clients', 'admins']) 
})
