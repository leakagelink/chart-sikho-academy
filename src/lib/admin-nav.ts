export const adminNav = [
  {group:'admin_grp_overview',items:[{section:'overview'},{section:'reports'}]},
  {group:'admin_grp_learning',items:[{section:'categories'},{section:'builder'},{section:'courses'},{section:'lessons'},{section:'videos'},{section:'ebooks'},{section:'classes'},{section:'webinars'},{section:'quizzes'},{section:'questions'},{section:'certificates'},{section:'progress'},{section:'reviews'}]},
  {group:'admin_grp_commerce',items:[{section:'pricing'},{section:'orders'},{section:'payments'},{section:'coupons'},{section:'refunds'},{section:'invoices'},{section:'abandoned'}]},
  {group:'admin_grp_users',items:[{section:'users'},{section:'bookings'},{section:'instructors'},{section:'roles'},{section:'verification'},{section:'blocked'},{section:'bulk'}]},
  {group:'admin_grp_referral',items:[{section:'refsettings'},{section:'reflinks'},{section:'affiliates'},{section:'teamtree'},{section:'commrules'},{section:'commissions'},{section:'ranks'},{section:'bonuses'},{section:'payouts'},{section:'fraud'}]},
  {group:'admin_grp_engagement',items:[{section:'notifications'},{planned:'admin_nav_email_tpl',phase:6},{planned:'admin_nav_wa_tpl',phase:6},{planned:'admin_nav_sms',phase:6},{planned:'admin_nav_push',phase:6},{planned:'admin_nav_announcements',phase:6},{planned:'admin_nav_tickets',phase:6}]},
  {group:'admin_grp_growth',items:[{planned:'admin_nav_landing',phase:6},{planned:'admin_nav_banners',phase:6},{planned:'admin_nav_aff_tools',phase:6},{planned:'admin_nav_campaigns',phase:6},{planned:'admin_nav_leads',phase:6},{planned:'admin_nav_seo',phase:6},{planned:'admin_nav_promo',phase:6}]},
  {group:'admin_grp_system',items:[{section:'settings'},{planned:'admin_nav_gateway',phase:4},{planned:'admin_nav_tax',phase:4},{planned:'admin_nav_security',phase:6},{planned:'admin_nav_backup',phase:6},{planned:'admin_nav_api',phase:6},{planned:'admin_nav_integrations',phase:6},{planned:'admin_nav_maintenance',phase:6}]},
] as const;
