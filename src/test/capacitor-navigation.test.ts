import { describe, expect, it } from 'vitest';
import config from '../../capacitor.config';

describe('Android app navigation', () => {
  it('keeps the client test app as the launch URL', () => {
    expect(config.server?.url).toBe(
      'https://id-preview--62b93306-bbec-431c-8a80-05c6306a5ecd.lovable.app',
    );
  });

  it('allows only this project’s known app hosts inside the WebView', () => {
    expect(config.server?.allowNavigation).toEqual([
      'id-preview--62b93306-bbec-431c-8a80-05c6306a5ecd.lovable.app',
      'chart-sikho-course-hub.lovable.app',
    ]);
  });
});