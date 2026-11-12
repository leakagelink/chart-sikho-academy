import { describe, expect, it } from 'vitest';
import { notificationTarget } from './notification-link';

describe('notificationTarget', () => {
  it('opens an admin https link externally', () => { expect(notificationTarget('https://chartsikho.in/plans')).toEqual({ href: 'https://chartsikho.in/plans', external: true, custom: true }); });
  it('keeps site paths inside the app', () => { expect(notificationTarget('/courses')).toEqual({ href: '/courses', external: false, custom: true }); });
  it('falls back to the inbox when no link is set', () => { expect(notificationTarget('')).toEqual({ href: '/notifications', external: false, custom: false }); });
  it('rejects unsafe links', () => { for (const bad of ['javascript:alert(1)', '//evil.com', 'http://x.com']) expect(notificationTarget(bad).custom).toBe(false); });
});
