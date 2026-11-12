import { expect, it } from 'vitest';
import { isRecoveryHash, recoveryPasswordError } from './password-recovery';

it('recognizes only password recovery links', () => {
  expect(isRecoveryHash('#type=recovery')).toBe(true);
  expect(isRecoveryHash('#type=signup')).toBe(false);
  expect(isRecoveryHash('')).toBe(false);
  expect(isRecoveryHash('#type=recovery&error_code=otp_expired')).toBe(false);
});
it('rejects nonmatching password confirmation', () => {
  expect(recoveryPasswordError('new-password', 'different-password')).toBe('reset_password_mismatch');
  expect(recoveryPasswordError('new-password', 'new-password')).toBe(null);
});
it('retains the existing six-character minimum', () => {
  expect(recoveryPasswordError('12345', '12345')).toBe('reset_password_short');
  expect(recoveryPasswordError('123456', '123456')).toBe(null);
});