import { z } from 'zod'
export const createInvoiceSchema = z.object({ amount: z.number().min(0), due_date: z.string() })
export const uploadProofSchema = z.object({ proof_url: z.string().url() })
export const invoiceStatusSchema = z.object({ status: z.enum(['Paid', 'Unpaid', 'Overdue']) })
export const processPayoutSchema = z.object({ talent_id: z.string(), booking_id: z.string(), amount: z.number().min(0) })
export const splitPaymentSchema = z.object({ invoice_id: z.string(), agency_amount: z.number().min(0), talent_amount: z.number().min(0) })
export const payoutStatusQuerySchema = z.object({ limit: z.string().optional().default('100'), offset: z.string().optional().default('0'), status: z.string().optional() })
