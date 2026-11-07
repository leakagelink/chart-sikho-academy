import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';

/** Read only the public logo; never expose the administration settings. */
export const getAppBranding = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) return null;
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
          headers.set('apikey', key);
          return fetch(input, { ...init, headers, signal: AbortSignal.timeout(8000) });
        },
      },
    });
    const { data, error } = await client.rpc('app_branding');
    if (error) return null;
    return typeof data === 'string' ? data : '';
  } catch {
    // Unknown branding is not the same as an intentional reset to the default.
    return null;
  }
});