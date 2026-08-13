import { z } from 'zod'
export const projectQuerySchema = z.object({
	limit: z.string().optional().default('100'),
	offset: z.string().optional().default('0'),
	status: z.string().optional(),
	category: z.string().optional(),
})

export const createProjectSchema = z.object({
	client_id: z.string().optional(),
	title: z.string().min(3),
	description: z.string().optional().default(''),
	status: z.string().optional().default('Draft'),
	visibility: z.enum(['public', 'private']).optional().default('public'),
	budget_total: z.number().optional().default(0),
	category_specific_data: z.object({}).passthrough().optional().default({}),
	roles: z.array(z.object({
		role_name: z.string().min(1),
		quantity: z.number().min(1).optional(),
		quantity_needed: z.number().min(1).optional(),
		budget: z.number().min(0).optional(),
		budget_per_talent: z.number().min(0).optional(),
		gender: z.string().optional(),
		age_min: z.number().optional(),
		age_max: z.number().optional(),
	})).optional().default([]),
})

export const updateProjectSchema = z.object({
	title: z.string().min(3).optional(),
	description: z.string().optional(),
	status: z.string().optional(),
	moodboards: z.array(z.any()).optional(),
	budget_total: z.number().optional(),
	category_specific_data: z.object({}).passthrough().optional(),
	is_casting_open: z.boolean().optional(),
})

export const createRoleSchema = z.object({ role_name: z.string(), quantity_needed: z.number().min(1), budget_per_talent: z.number().min(0) })
