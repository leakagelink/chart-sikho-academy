import { supabase } from '@/integrations/supabase/client';

/** Only public website artwork goes here; payment, profile and KYC files stay separate. */
export async function uploadAdminImage(file: File, section: string) {
  const extension: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' };
  const ext = extension[file.type];
  if (!ext || file.size > 500 * 1024) throw new Error('Invalid image');
  const folder = section === 'pricing' ? 'courses' : section;
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const result = await supabase.storage.from('site-images').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (result.error) throw result.error;
  return `/api/public/site-file/${folder}/${path.split('/')[1]}`;
}