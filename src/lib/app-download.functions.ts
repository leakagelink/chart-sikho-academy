import { createServerFn } from '@tanstack/react-start';

const BUCKET = 'app-downloads';
const FILE = 'chartsikho.apk';

/**
 * Public: returns a short-lived download link for the single published APK only.
 * The bucket has no public read rule; the server signs this one fixed path and
 * never accepts a caller-supplied file name.
 */
export const getAppDownloadUrl = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: files } = await supabaseAdmin.storage.from(BUCKET).list('', { search: FILE });
    if (!files?.some((f) => f.name === FILE)) return null;
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(FILE, 3600, { download: 'ChartSikho.apk' });
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
});
