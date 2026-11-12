import { bannerLink } from './website-banners';

/** Where a notification's "Know More" goes: the admin's safe link, or the inbox when none/invalid. */
export function notificationTarget(link: string | null | undefined): { href: string; external: boolean; custom: boolean } {
  const parsed = bannerLink.safeParse(link ?? '');
  const href = parsed.success && parsed.data ? parsed.data : '';
  if (!href) return { href: '/notifications', external: false, custom: false };
  return { href, external: !href.startsWith('/'), custom: true };
}
