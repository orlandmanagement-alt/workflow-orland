import { z } from 'zod'
export const createCatSchema = z.object({ category_name: z.string().min(2) })
export const createSkillSchema = z.object({ skill_name: z.string().min(2) })
