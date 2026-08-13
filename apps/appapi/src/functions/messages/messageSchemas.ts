import { z } from 'zod'
export const threadQuerySchema = z.object({ thread_id: z.string(), limit: z.string().optional().default('50'), offset: z.string().optional().default('0') })
export const sendMessageSchema = z.object({ body: z.string().min(1).max(2000) })
