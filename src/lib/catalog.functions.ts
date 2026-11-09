import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { visibleCategories } from './category-visibility';
import { siteImage } from './site-image';
export const getWebsiteBanners=createServerFn({method:'GET'}).handler(async()=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']!;
 const s=createClient<Database>(process.env['SUPABASE_URL']!,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const r=await s.from('banners').select('id,title,image_url,link_url,placement,position,active').eq('active',true).order('position');if(r.error)throw new Error('Unable to load banners');return r.data;
});
export const getHomeCategories = createServerFn({method:'GET'}).handler(async () => {
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']!;
 const s=createClient<Database>(process.env['SUPABASE_URL']!,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const result=await s.from('course_categories').select('id,name,slug,icon_url,position,is_visible').eq('is_visible',true).order('position').order('name');
 if(result.error)throw new Error('Unable to load categories');
 return visibleCategories((result.data ?? []).map(c=>({...c,icon_url:siteImage('category',c.id,c.icon_url)})));
});
export const getPublishedProducts = createServerFn({method:'GET'}).handler(async () => {
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']!;
 const s=createClient<Database>(process.env['SUPABASE_URL']!,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const [ebooks, sessions] = await Promise.all([
  s.from('ebooks').select('id,title,description,price,cover_url,has_file').eq('status','published'),
  s.rpc('session_catalog'),
 ]);
 if (ebooks.error || sessions.error) throw new Error('Unable to load products');
 return { ebooks: (ebooks.data ?? []).map(e=>({...e,cover_url:siteImage('ebook',e.id,e.cover_url)})), sessions: (sessions.data ?? []).map(x=>({...x,thumbnail_url:siteImage('session',x.id,x.thumbnail_url)})) };
});
export const getPublishedCatalog=createServerFn({method:'GET'}).handler(async()=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']!;
 const s=createClient<Database>(process.env['SUPABASE_URL']!,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const r=await s.from('courses').select('id,title,category,price,sale_price,status,thumbnail_url,description,instructor').eq('status','published');if(r.error)throw new Error('Unable to load courses');return r.data.map(c=>({...c,thumbnail_url:siteImage('course',c.id,c.thumbnail_url)}));
});
export const verifyCertificate=createServerFn({method:'GET'}).inputValidator((i:{no:string})=>({no:String(i.no).slice(0,40)})).handler(async({data})=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']!;
 const s=createClient<Database>(process.env['SUPABASE_URL']!,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const r=await s.rpc('verify_certificate',{_no:data.no});if(r.error)throw new Error('Unable to verify');return r.data?.[0]??null;
});
