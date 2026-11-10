import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { publishedPlans } from './plans';

export const getPublishedPlans = createServerFn({method: 'GET'}).handler(async () => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  const s = createClient<Database>(process.env['SUPABASE_URL']!, key, {
    auth: {persistSession: false, autoRefreshToken: false},
    global: {fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization');
      h.set('apikey', key);
      return fetch(input, {...init, headers: h});
    }},
  });
  const r = await s.from('membership_plans').select('id,name_en,name_hi,price,billing_period,features_en,features_hi,popular,position,status,access_categories,access_days').eq('status','published').order('position');
  if (r.error) throw new Error('Unable to load plans');
  return publishedPlans(r.data ?? []);
});