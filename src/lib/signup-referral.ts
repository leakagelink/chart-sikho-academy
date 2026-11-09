export function normalizeSignupReferral(value: string): string {
  return value.trim().toUpperCase();
}
export function referralSignupLink(code: string): string {
  const url = new URL('/auth', 'https://chartsikho.in');
  url.searchParams.set('ref', normalizeSignupReferral(code));
  return url.toString();
}
export function signupReferralFormatValid(value: string): boolean {
  const code = normalizeSignupReferral(value);
  return code === '' || /^[A-Z0-9]{4,40}$/.test(code);
}