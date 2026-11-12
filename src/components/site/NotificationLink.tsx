import type { MouseEvent, ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';
import { notificationTarget } from '@/lib/notification-link';

/** Anchor for a notification's link: site paths stay in the app, https links open in a new tab/browser. */
export function NotificationLink({ link, className, onNavigate, children }: { link: string | null | undefined; className?: string; onNavigate?: () => void; children: ReactNode }) {
  const router = useRouter();
  const target = notificationTarget(link);
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();
    if (target.external || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    router.history.push(target.href);
  };
  return <a href={target.href} onClick={onClick} className={className} {...(target.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
}
