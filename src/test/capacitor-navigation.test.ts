import { describe, expect, it } from 'vitest';
import config from '../../capacitor.config';
import { NATIVE_APP_UA_MARKER } from '../lib/native-app';

describe('Android app navigation', () => {
  it('launches the primary public domain, not the private preview that needs a Lovable login', () => {
    expect(config.server?.url).toBe('https://chartsikho.in');
    expect(config.server?.url).not.toContain('id-preview--');
  });

  it('allows the public domain and its lovable.app host inside the WebView', () => {
    expect(config.server?.allowNavigation).toEqual(['chartsikho.in', 'www.chartsikho.in', 'chart-sikho-course-hub.lovable.app']);
  });

  it('marks the app user agent so app-only screens can be shown', () => {
    expect(config.appendUserAgent).toBe(NATIVE_APP_UA_MARKER);
  });
});
