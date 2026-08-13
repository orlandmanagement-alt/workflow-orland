import { z } from 'zod'
export const kybDocSchema = z.object({ doc_url: z.string().url(), entity_type: z.string().default('Client') })
