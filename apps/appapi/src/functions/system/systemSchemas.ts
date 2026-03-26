// Menambahkan skema untuk Disputes & Evaluations ke file yang sudah ada
import { z } from 'zod'
export const roleSchema = z.object({ role_name: z.string().min(3), permissions: z.array(z.string()).min(1) })
export const suspendSchema = z.object({ reason: z.string().min(5) })

export const disputeSchema = z.object({ project_id: z.string().optional(), issue: z.string().min(10) })
export const evalSchema = z.object({ rating: z.number().min(1).max(5), feedback: z.string() })
