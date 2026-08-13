import { z } from 'zod'
export const createBookingSchema = z.object({ talent_id: z.string(), agreed_fee: z.number().min(0).optional() })
export const updateStatusSchema = z.object({ status: z.enum(['Shortlisted', 'Offered', 'Accepted', 'Rejected', 'Completed']) })
export const uploadMediaSchema = z.object({ file_url: z.string().url() })
export const reviewPayloadSchema = z.object({ rating: z.number().min(1).max(5), feedback: z.string() })
