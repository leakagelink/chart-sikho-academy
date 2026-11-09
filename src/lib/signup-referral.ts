export function normalizeSignupReferral(value: string): string {
  return value.trim().toUpperCase();
}
export function signupReferralFormatValid(value: string): boolean {
  const code = normalizeSignupReferral(value);
  return code === '' || /^[A-Z0-9]{4,40}$/.test(code);
}