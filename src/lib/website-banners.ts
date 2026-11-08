import { z } from 'zod';
export const bannerImage=z.union([z.string().max(700000).regex(/^data:image\/(png|jpeg|webp|svg\+xml);base64,/),z.string().url().max(500).startsWith('https://')]);
export type WebsiteBanner={id:string;title:string;image_url:string;link_url:string;placement:string;position:number;active:boolean};
export function bannersForPage<T extends WebsiteBanner>(rows:T[],page:string){return rows.filter(r=>r.active&&r.placement===page&&r.image_url).sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));}