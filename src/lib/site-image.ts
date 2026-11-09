/**
 * Images saved as inline data (data:image/...) are huge. Pages reference them through a
 * cacheable image link instead, so the HTML stays small and browsers cache the picture.
 */
export type SiteImageKind = 'logo' | 'course' | 'ebook' | 'session' | 'category';

function fingerprint(value: string) {
  let h = 5381;
  const step = Math.max(1, Math.floor(value.length / 4000));
  for (let i = 0; i < value.length; i += step) h = ((h << 5) + h + value.charCodeAt(i)) | 0;
  return `${value.length.toString(36)}${(h >>> 0).toString(36)}`;
}

export function siteImage(kind: SiteImageKind, id: string, value: string | null | undefined): string {
  if (!value || !value.startsWith('data:')) return value ?? '';
  return `/api/public/site-image/${kind}/${encodeURIComponent(id)}?v=${fingerprint(value)}`;
}

export function decodeImageData(value: string): { type: string; bytes: Uint8Array } | null {
  const m = /^data:(image\/(?:png|jpeg|jpg|webp|gif|svg\+xml));base64,(.+)$/s.exec(value);
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { type: m[1], bytes };
}
