import { describe, expect, it } from 'vitest';
import { planSchema, publishedPlans, planCategorySchema, planCategories } from './plans';
import { adminChangeSchema, adminDeleteSchema } from './admin-rules';
import { canAccess, canReadDataset } from './admin-permissions';

describe('Managed plans', () => {
  it('allows live classes only without granting courses', () => {
    expect(planCategorySchema.parse('classes')).toEqual(['classes']);
  });
  it('allows live classes plus all courses', () => {
    expect(planCategorySchema.parse('classes,courses')).toEqual(['classes','courses']);
  });
  it('allows live classes, courses and webinars', () => {
    expect(planCategorySchema.parse('classes,courses,webinars')).toEqual(['classes','courses','webinars']);
  });
  it('allows all five product categories', () => {
    expect(planCategorySchema.parse([...planCategories])).toEqual(['courses','classes','webinars','seminars','ebooks']);
  });
  it('rejects empty or undefined category access', () => {
    expect(planCategorySchema.safeParse('').success).toBe(false);
    expect(planCategorySchema.safeParse('unknown').success).toBe(false);
  });
  it('saves independently priced 100 and 200 rupee plans with custom days', () => {
    const base={name_en:'Live plan',billing_period:'monthly',position:1,status:'draft',access_categories:'classes',access_days:10};
    expect(planSchema.parse({...base,price:100}).price).toBe(100);
    expect(planSchema.parse({...base,price:200}).price).toBe(200);
    expect(planSchema.parse({...base,price:100}).access_days).toBe(10);
    expect(planSchema.safeParse({...base,price:100,access_days:-1}).success).toBe(false);
  });
  it('supports admin plan creation and editing', () => {
    expect(adminChangeSchema.safeParse({resource:'plans',values:{name_en:'Test plan'}}).success).toBe(true);
    expect(adminChangeSchema.safeParse({resource:'plans',id:'4983f790-7312-4cc2-b3e7-8bf374f535ed',values:{price:499}}).success).toBe(true);
  });
  it('supports plan deletion', () => {
    expect(adminDeleteSchema.safeParse({resource:'plans',id:'4983f790-7312-4cc2-b3e7-8bf374f535ed'}).success).toBe(true);
  });
  it('keeps actions scoped to the plans permission', () => {
    const access = {isAdmin:false,permissions:[{section:'plans' as const,action:'view' as const}]};
    expect(canReadDataset(access,'plans')).toBe(true);
    for (const action of ['create','edit','delete'] as const) expect(canAccess(access,'plans',action)).toBe(false);
    expect(canReadDataset(access,'orders')).toBe(false);
  });
  it('shows published plans only in configured order', () => {
    expect(publishedPlans([{id:'draft',status:'draft',position:1},{id:'second',status:'published',position:3},{id:'first',status:'published',position:2}]).map(p=>p.id)).toEqual(['first','second']);
  });
  it('validates saved plan values', () => {
    const plan = {name_en:'Test plan',price:499,billing_period:'monthly',position:1,status:'draft'};
    expect(planSchema.parse(plan).price).toBe(499);
    expect(planSchema.safeParse({...plan,price:-1}).success).toBe(false);
  });
});