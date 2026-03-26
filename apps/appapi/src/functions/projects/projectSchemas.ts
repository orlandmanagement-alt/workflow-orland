import { z } from 'zod'
export const projectQuerySchema = z.object({ limit: z.string().optional().default('100'), offset: z.string().optional().default('0'), status: z.string().optional() })
export const createProjectSchema = z.object({ client_id: z.string(), title: z.string().min(3), status: z.string().default('Draft') })
export const updateProjectSchema = z.object({ title: z.string().min(3), status: z.string() })
export const createRoleSchema = z.object({ role_name: z.string(), quantity_needed: z.number().min(1), budget_per_talent: z.number().min(0) })
