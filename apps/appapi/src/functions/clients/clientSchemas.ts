import { z } from 'zod'
export const clientQuerySchema = z.object({ limit: z.string().optional().default('100'), offset: z.string().optional().default('0'), type: z.string().optional() })
export const updateClientSchema = z.object({ company_name: z.string().min(2), client_type: z.string() })
export const addMemberSchema = z.object({ user_id: z.string() })
