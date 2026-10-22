import { describe, expect, it } from 'vitest';
import config from '../../capacitor.config';

describe('Android app navigation', () => {
  it('launches the public app link, not the private preview that needs a Lovable login', () => {
    expect(config.server?.url).toBe('https://chart-sikho-course-hub.lovable.app');
    expect(config.server?.url).not.toContain('id-preview--');
  });

  it('allows only this project’s public app host inside the WebView', () => {
    expect(config.server?.allowNavigation).toEqual(['chart-sikho-course-hub.lovable.app']);
  });
});
