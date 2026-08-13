import { z } from 'zod'
export const dateQuerySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD") })
export const attendancePayloadSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
