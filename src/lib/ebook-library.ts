import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LibraryEbook = { id: string; title: string; cover_url: string; price: number; has_file: boolean; access: 'purchased' | 'free' | 'membership' };

/** eBooks the signed-in student may open (paid order, free, or an active membership that includes eBooks), decided by the database. */
export const ebookLibraryQuery = (userId: string | undefined) => queryOptions({
  queryKey: ['ebook-library', userId],
  enabled: !!userId,
  refetchInterval: 15000,
  queryFn: async (): Promise<LibraryEbook[]> => {
    const r = await supabase.rpc('my_ebook_library');
    if (r.error) throw r.error;
    return (r.data ?? []) as LibraryEbook[];
  },
});

/** Short-lived signed links for reading in-app and for downloading; the RPC refuses callers without access. */
export const ebookFileQuery = (ebookId: string) => queryOptions({
  queryKey: ['ebook-file', ebookId],
  staleTime: 45 * 60 * 1000,
  retry: false,
  queryFn: async () => {
    const r = await supabase.rpc('my_ebook_resource', { _ebook_id: ebookId });
    if (r.error) throw new Error(r.error.message.includes('Purchase required') ? 'no-access' : 'failed');
    if (!r.data) throw new Error('missing');
    const bucket = supabase.storage.from('course-resources');
    const [read, dl] = await Promise.all([bucket.createSignedUrl(r.data, 3600), bucket.createSignedUrl(r.data, 3600, { download: true })]);
    if (read.error || !read.data) throw new Error('missing');
    return { readUrl: read.data.signedUrl, downloadUrl: dl.data?.signedUrl ?? read.data.signedUrl };
  },
});
