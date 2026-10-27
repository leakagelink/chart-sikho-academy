import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
export const getPublishedCatalog=createServerFn({method:'GET'}).handler(async()=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']!;
 const s=createClient<Database>(process.env['SUPABASE_URL']!,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const r=await s.from('courses').select('id,title,category,price,status').eq('status','published');if(r.error)throw new Error('Unable to load courses');return r.data;
});
export const verifyCertificate=createServerFn({method:'GET'}).inputValidator((i:{no:string})=>({no:String(i.no).slice(0,40)})).handler(async({data})=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']!;
 const s=createClient<Database>(process.env['SUPABASE_URL']!,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const r=await s.rpc('verify_certificate',{_no:data.no});if(r.error)throw new Error('Unable to verify');return r.data?.[0]??null;
});
