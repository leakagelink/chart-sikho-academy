import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Public delivery: the site_file_is_public RPC confirms a published/visible record references
// this file, then the server downloads it. There is no open storage read rule for this bucket.
// Signed-in panel users fall back to their own storage permissions.
const SHARE_WIDTHS = new Set([400, 600, 800]);

export const Route = createFileRoute('/api/public/site-file/$section/$file')({
  server: { handlers: { GET: async ({ params, request }) => {
    if (!/^(courses|categories|classes|webinars|seminars|ebooks|notifications|settings|banners)$/.test(params.section) || !/^[0-9a-f-]{36}\.(png|jpg|webp|svg)$/.test(params.file)) return new Response('Not found', { status: 404 });
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    const url = process.env['SUPABASE_URL'];
    if (!key || !url) return new Response('Unavailable', { status: 503 });
    const path = `${params.section}/${params.file}`;
    const authorization = request.headers.get('Authorization');
    const makeClient = (auth: string | null) => createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        if (auth) headers.set('Authorization', auth);
        return fetch(input, { ...init, headers });
      } },
    });

    const check = await makeClient(null).rpc('site_file_is_public', { _name: path });
    let blob: Blob | null = null;
    let isPublic = false;
    if (!check.error && check.data === true) {
      isPublic = true;
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      // ?w=<width> returns a smaller JPEG/WebP for link previews (WhatsApp skips large pictures).
      const width = Number(new URL(request.url).searchParams.get('w'));
      if (SHARE_WIDTHS.has(width) && !params.file.endsWith('.svg')) {
        const small = await supabaseAdmin.storage.from('site-images').download(path, { transform: { width, quality: 70, resize: 'contain' } });
        if (!small.error && small.data.size > 0) blob = small.data;
      }
      if (!blob) {
        const result = await supabaseAdmin.storage.from('site-images').download(path);
        blob = result.error ? null : result.data;
      }
    } else if (authorization) {
      const result = await makeClient(authorization).storage.from('site-images').download(path);
      blob = result.error ? null : result.data;
    }
    if (!blob) return new Response('Not found', { status: 404 });
    return new Response(blob, { headers: {
      'Content-Type': blob.type,
      'Cache-Control': isPublic ? 'public, max-age=86400' : 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    } });
  } } },
});
