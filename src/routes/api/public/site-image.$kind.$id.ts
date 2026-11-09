import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { decodeImageData } from '@/lib/site-image';

const UUID = /^[0-9a-f-]{36}$/i;

// Public image endpoint: reads only data that is already public (published products, visible
// categories, public catalog RPC, public branding RPC) with the publishable key.
async function readImage(kind: string, id: string): Promise<string | null> {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  const s = createClient<Database>(process.env['SUPABASE_URL']!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization'); h.set('apikey', key); return fetch(input, { ...init, headers: h }); } },
  });
  if (kind === 'logo') { const r = await s.rpc('app_branding'); return typeof r.data === 'string' ? r.data : null; }
  if (!UUID.test(id)) return null;
  if (kind === 'course') { const r = await s.from('courses').select('thumbnail_url').eq('id', id).eq('status', 'published').maybeSingle(); return r.data?.thumbnail_url ?? null; }
  if (kind === 'ebook') { const r = await s.from('ebooks').select('cover_url').eq('id', id).eq('status', 'published').maybeSingle(); return r.data?.cover_url ?? null; }
  if (kind === 'category') { const r = await s.from('course_categories').select('icon_url').eq('id', id).maybeSingle(); return r.data?.icon_url ?? null; }
  if (kind === 'session') { const r = await s.rpc('session_catalog'); return r.data?.find(x => x.id === id)?.thumbnail_url ?? null; }
  return null;
}

export const Route = createFileRoute('/api/public/site-image/$kind/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const value = await readImage(params.kind, params.id).catch(() => null);
        if (value?.startsWith('https://')) return Response.redirect(value, 302);
        const img = value ? decodeImageData(value) : null;
        if (!img) return new Response('Not found', { status: 404 });
        return new Response(img.bytes.buffer as ArrayBuffer, {
          headers: {
            'Content-Type': img.type,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
          },
        });
      },
    },
  },
});
