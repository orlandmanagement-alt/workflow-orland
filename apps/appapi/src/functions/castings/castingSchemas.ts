import { z } from 'zod'
export const liveBoardSchema = z.object({ role_title: z.string().min(3), expires_at: z.string() })
export const guestJoinSchema = z.object({ guest_name: z.string().min(2), guest_phone: z.string().min(8), selfie_url: z.string().url() })
