import type { AdminSection } from './admin-rules';
import type { DictKey } from './i18n';
type NavItem = { section: AdminSection } | { planned: DictKey; phase: number };
export const adminNav: { group: DictKey; items: NavItem[] }[] = [
  {group:'admin_grp_overview',items:[{section:'overview'}]},
  {group:'admin_grp_learning',items:[{section:'categories'},{section:'builder'},{section:'courses'},{section:'lessons'},{section:'videos'},{section:'ebooks'},{section:'classes'},{section:'webinars'},{section:'quizzes'},{section:'questions'},{section:'certificates'},{section:'progress'},{section:'reviews'}]},
  {group:'admin_grp_commerce',items:[{section:'pricing'},{section:'orders'},{section:'payments'},{section:'coupons'},{section:'refunds'},{section:'invoices'}]},
  {group:'admin_grp_users',items:[{section:'users'},{section:'instructors'},{section:'roles'},{section:'verification'},{section:'blocked'},{section:'bulk'}]},
  {group:'admin_grp_referral',items:[{section:'refsettings'},{section:'reflinks'},{section:'affiliates'},{section:'teamtree'},{section:'commrules'},{section:'commissions'},{section:'ranks'},{section:'bonuses'},{section:'payouts'},{section:'fraud'}]},
  {group:'admin_grp_engagement',items:[{section:'notifications'},{section:'templates'},{section:'announcements'},{section:'tickets'}]},
  {group:'admin_grp_growth',items:[{section:'banners'},{section:'campaigns'},{section:'leads'},{section:'seo'},{section:'promocodes'}]},
  {group:'admin_grp_system',items:[{section:'settings'},{section:'maintenance'}]},
] as const;
