import { z } from 'zod'
export const searchFilterSchema = z.object({
  keyword: z.string().optional(),
  category: z.string().optional(),
  min_rate: z.number().min(0).optional(),
  max_rate: z.number().min(0).optional(),
  limit: z.number().max(100).default(50),
  offset: z.number().default(0)
})
export const vectorPayloadSchema = z.object({
  image_url: z.string().url().optional(),
  text_query: z.string().optional()
}).refine(data => data.image_url || data.text_query, { message: "Harus menyertakan image_url atau text_query" })
