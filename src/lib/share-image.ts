/** Link-preview helpers: WhatsApp/Facebook need an absolute, reasonably small image URL. */
const SITE = 'https://chartsikho.in';

/** Absolute share-sized URL for a product picture, or '' when there is no usable picture. */
export function shareImageUrl(value: string | null | undefined): string {
  if (!value || value.startsWith('data:')) return '';
  let url: URL;
  try { url = new URL(value, SITE); } catch { return ''; }
  if (url.protocol !== 'https:') return '';
  // Uploaded artwork on the asset CDN can be resized with ?w=, keeping previews light.
  if (url.pathname.startsWith('/__l5e/assets-v1/') && !url.searchParams.has('w')) url.searchParams.set('w', '800');
  return url.toString();
}

/** Plain one-line description for previews (strips markdown, caps the length). */
export function shareDescription(value: string | null | undefined, fallback: string): string {
  const text = (value ?? '').replace(/^#+\s*/gm, '').replace(/\*\*|__|`|[*_>]/g, '').replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

export function shareImageMeta(image: string): Array<Record<string, string>> {
  return image ? [{ property: 'og:image', content: image }, { name: 'twitter:image', content: image }] : [];
}
