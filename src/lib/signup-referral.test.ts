import { expect, it } from 'vitest';
import { normalizeSignupReferral, signupReferralFormatValid } from './signup-referral';
it('referral code is optional', () => expect(signupReferralFormatValid('  ')).toBe(true));
it('accepts existing referral codes case insensitively', () => expect(normalizeSignupReferral(' csad62e080 ')).toBe('CSAD62E080'));
it('rejects malformed referral codes', () => expect(signupReferralFormatValid('not a code!')).toBe(false));