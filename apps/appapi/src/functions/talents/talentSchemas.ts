import { z } from 'zod'

export const talentQuerySchema = z.object({ limit: z.string().optional().default('100'), offset: z.string().optional().default('0'), category: z.string().optional() })
export const createTalentSchema = z.object({ full_name: z.string().min(2), category: z.string(), base_rate: z.number().min(0) })
export const updateTalentSchema = z.object({ full_name: z.string().min(2), category: z.string(), base_rate: z.number().min(0) })

export const createExpSchema = z.object({ title: z.string().min(2), year: z.number().min(1900), month: z.string().optional(), company: z.string().optional(), description: z.string().optional() })
export const updateExpSchema = createExpSchema

export const createCertSchema = z.object({ cert_name: z.string().min(2), issued_by: z.string(), year: z.number().min(1900) })
export const createBankSchema = z.object({ bank_name: z.string(), account_number: z.string(), account_name: z.string() })
export const createRateCardSchema = z.object({ service_name: z.string(), amount: z.number().min(0) })
export const createNoteSchema = z.object({ note_text: z.string().max(1000) })
