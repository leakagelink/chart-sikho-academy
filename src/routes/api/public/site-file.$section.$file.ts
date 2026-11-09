import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Storage RLS permits anonymous reads only when a visible record references this file.
export const Route = createFileRoute('/api/public/site-file/$section/$file')({
  server: { handlers: { GET: async ({ params, request }) => {
    if (!/^(courses|categories|classes|webinars|seminars|ebooks|notifications|settings|banners)$/.test(params.section) || !/^[0-9a-f-]{36}\.(png|jpg|webp|svg)$/.test(params.file)) return new Response('Not found', { status: 404 });
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    const url = process.env['SUPABASE_URL'];
    if (!key || !url) return new Response('Unavailable', { status: 503 });
    const authorization = request.headers.get('Authorization');
    const s = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        if (authorization) headers.set('Authorization', authorization);
        return fetch(input, { ...init, headers });
      } },
    });
    const result = await s.storage.from('site-images').download(`${params.section}/${params.file}`);
    if (result.error || !result.data) return new Response('Not found', { status: 404 });
    return new Response(result.data, { headers: {
      'Content-Type': result.data.type,
      'Cache-Control': authorization ? 'private, no-store' : 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    } });
  } } },
});