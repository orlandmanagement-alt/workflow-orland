import { z } from 'zod'
export const kycDocSchema = z.object({ id_card_url: z.string().url(), selfie_url: z.string().url() })
export const livenessSchema = z.object({ video_url: z.string().url() })
export const statusSchema = z.object({ status: z.enum(['Verified', 'Rejected', 'Pending']) })
