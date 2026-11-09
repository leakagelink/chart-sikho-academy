export type SocialProductKind = 'course' | 'ebook' | 'session' | 'plan';
export function productSharePath(kind: SocialProductKind, id: string): string {
  if (kind === 'course') return `/courses/${encodeURIComponent(id)}`;
  if (kind === 'session') return `/live/${encodeURIComponent(id)}`;
  if (kind === 'ebook') return `/ebooks#ebook-${encodeURIComponent(id)}`;
  return `/plans#plan-${encodeURIComponent(id)}`;
}
export function validProductComment(body: string): boolean { return body.trim().length > 0 && body.trim().length <= 1000; }