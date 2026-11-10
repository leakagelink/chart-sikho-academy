import { z } from 'zod';

export const planCategories = ['courses', 'classes', 'webinars', 'seminars', 'ebooks'] as const;
export const planCategorySchema = z.preprocess(v => typeof v === 'string' ? v.split(',').filter(Boolean) : v, z.array(z.enum(planCategories)).min(1).transform(v => [...new Set(v)]));

export const planSchema = z.object({
  name_en: z.string().trim().min(2).max(120),
  name_hi: z.string().trim().max(120).default(''),
  price: z.coerce.number().int().min(0).max(1000000),
  billing_period: z.enum(['monthly', 'yearly', 'lifetime']),
  access_categories: planCategorySchema.default([...planCategories]),
  access_days: z.coerce.number().int().min(0).max(36500).default(0),
  features_en: z.string().trim().max(2000).default(''),
  features_hi: z.string().trim().max(2000).default(''),
  popular: z.union([z.boolean(), z.enum(['true', 'false']).transform(v => v === 'true')]).default(false),
  position: z.coerce.number().int().min(1).max(1000),
  status: z.enum(['draft', 'published']),
});

export function publishedPlans<T extends {status: string; position: number}>(plans: T[]) {
  return plans.filter(p => p.status === 'published').sort((a, b) => a.position - b.position);
}