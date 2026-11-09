import { expect, it } from 'vitest';
import { normalizeSignupReferral, signupReferralFormatValid, referralSignupLink } from './signup-referral';
it('referral code is optional', () => expect(signupReferralFormatValid('  ')).toBe(true));
it('accepts existing referral codes case insensitively', () => expect(normalizeSignupReferral(' csad62e080 ')).toBe('CSAD62E080'));
it('rejects malformed referral codes', () => expect(signupReferralFormatValid('not a code!')).toBe(false));
it('short referral code is valid', () => expect(signupReferralFormatValid('A1B2C3')).toBe(true));
it('shared link opens signup with the sponsor code', () => expect(referralSignupLink(' a1b2c3 ')).toBe('https://chartsikho.in/auth?ref=A1B2C3'));