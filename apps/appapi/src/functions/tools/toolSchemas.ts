import { z } from 'zod'

// KOL Tools
export const briefSchema = z.object({ content: z.string().min(10), guidelines: z.record(z.any()) })
export const draftSchema = z.object({ video_url: z.string().url() })
export const reviewDraftSchema = z.object({ status: z.enum(['Approved', 'Revision']), feedback: z.string() })
export const linkSchema = z.object({ url: z.string().url() })
export const analysisSchema = z.object({ talent_id: z.string(), comments: z.array(z.string()).max(100) })

// WO / EO Tools
export const rundownSchema = z.object({ timeline: z.array(z.record(z.any())).min(1) })
export const songSchema = z.object({ must_play: z.array(z.string()), do_not_play: z.array(z.string()) })
export const riderSchema = z.object({ requirements: z.array(z.string()).min(1) })
