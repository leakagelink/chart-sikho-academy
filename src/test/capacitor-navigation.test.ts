import { describe, expect, it } from 'vitest';
import config from '../../capacitor.config';

describe('Android app navigation', () => {
  it('launches the primary public domain, not the private preview that needs a Lovable login', () => {
    expect(config.server?.url).toBe('https://chartsikho.socilet.one');
    expect(config.server?.url).not.toContain('id-preview--');
  });

  it('allows the public domain and its lovable.app host inside the WebView', () => {
    expect(config.server?.allowNavigation).toEqual(['chartsikho.socilet.one', 'chart-sikho-course-hub.lovable.app']);
  });
});
