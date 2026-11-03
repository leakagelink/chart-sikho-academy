import { z } from 'zod';
import { adminSections, type AdminSection } from './admin-rules';

export const permissionActions = ['view', 'create', 'edit', 'delete'] as const;
export type PermissionAction = typeof permissionActions[number];
export type PanelPermission = { section: AdminSection; action: PermissionAction };
export type PanelAccess = { isAdmin: boolean; permissions: PanelPermission[] };
export const permissionSchema = z.object({ userId: z.string().uuid(), permissions: z.array(z.object({ section: z.enum(adminSections), action: z.enum(permissionActions) })).max(200) });
export function canAccess(access: PanelAccess, section: string, action: PermissionAction = 'view') {
  if (access.isAdmin) return true;
  if (section === 'roles' && action !== 'view') return false;
  return access.permissions.some(p => p.section === section && p.action === action);
}
export function resourceSections(resource: string): AdminSection[] {
  const aliases: Record<string, AdminSection[]> = { modules: ['builder'], courses: ['courses','builder','pricing'], lessons: ['lessons','builder'], videos: ['videos'], classes: ['classes','webinars'], users: ['users','blocked'], settings: ['settings','refsettings'], questions: ['questions','quizzes'], influencers: ['commrules'] };
  return aliases[resource] ?? [resource as AdminSection];
}
// Read dependencies for selectors and derived columns; never return unrelated private datasets.
export const datasetSections: Record<string, AdminSection[]> = {
  users:['users','roles','verification','blocked','bulk','reflinks','teamtree','affiliates','orders','payments','commissions','payouts','certificates','progress','reviews','refunds','bonuses','notifications','announcements','tickets','fraud'],
  courses:['courses','builder','lessons','videos','classes','webinars','pricing','quizzes','certificates','progress','reviews','orders','payments','notifications','announcements'],
  lessons:['lessons','videos','builder','courses','classes','webinars'], modules:['builder','lessons','classes','webinars','courses'], categories:['categories','courses','builder','classes','webinars','pricing'],
  classes:['classes','webinars'], ebooks:['ebooks'], enrollments:['progress','courses','certificates','users','bulk'], orders:['orders','payments','invoices','fraud'], affiliates:['affiliates','teamtree','fraud'], commissions:['commissions','fraud'], payouts:['payouts'], notifications:['notifications'], settings:['settings','refsettings','commrules','maintenance'], audit:[], quizzes:['quizzes','questions','courses','builder'], questions:['questions','quizzes'], certificates:['certificates'], reviews:['reviews'], coupons:['coupons','promocodes'], refunds:['refunds'], invoices:['invoices'], instructors:['instructors'], ranks:['ranks'], bonuses:['bonuses'], userRoles:['roles'], templates:['templates','campaigns'], announcements:['announcements'], tickets:['tickets'], banners:['banners'], campaigns:['campaigns'], leads:['leads'], seo:['seo'], promocodes:['promocodes'], influencers:['commrules','affiliates','commissions'],
};
export function canReadDataset(access: PanelAccess, key: string) {
  return access.isAdmin || canAccess(access,'overview') || (datasetSections[key] ?? []).some(s => canAccess(access,s));
}