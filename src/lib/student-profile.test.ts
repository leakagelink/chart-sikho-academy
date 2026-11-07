import { describe, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { profilePhotoAllowed, profileValues } from './student-profile';

describe('student profile updates', () => {
  it('permits updating the profile image with a supported photo', () => {
    expect(profilePhotoAllowed({ type: 'image/png', size: 1024 })).toBe(true);
    expect(profilePhotoAllowed({ type: 'image/svg+xml', size: 1024 })).toBe(false);
    expect(profilePhotoAllowed({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 })).toBe(false);
  });
  it('saves editable personal details and the selected image without account privileges', () => {
    const result = profileValues({ full_name: ' Student ', phone: '1234567890', state: 'MP', city: 'Indore', preferred_language: 'hi', address: ' A ', bio: ' B ', date_of_birth: '' }, 'user/photo.png');
    expect(result).toEqual({ _full_name: 'Student', _phone: '1234567890', _state: 'MP', _city: 'Indore', _preferred_language: 'hi', _address: 'A', _bio: 'B', _date_of_birth: null, _avatar_path: 'user/photo.png' });
    expect(result).not.toHaveProperty('account_status');
    expect(result).not.toHaveProperty('verification_status');
  });
});