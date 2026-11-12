export function isRecoveryHash(hash: string): boolean {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.get('type') === 'recovery' && !params.has('error') && !params.has('error_code');
}

export function recoveryPasswordError(password: string, confirmation: string): 'reset_password_short' | 'reset_password_mismatch' | null {
  if (password.length < 6) return 'reset_password_short';
  return password === confirmation ? null : 'reset_password_mismatch';
}