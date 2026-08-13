import { z } from 'zod'
export const fileMetaSchema = z.object({ file_name: z.string().min(1), file_type: z.string().regex(/^(image|video|application)\/.+/, "MIME type tidak valid") })
export const reorderSchema = z.object({ media_ids: z.array(z.string()).min(2, "Minimal 2 ID untuk diurutkan") })
