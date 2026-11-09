import { storedImageReference } from './image-reference';
export const bannerImage=storedImageReference.refine(value=>value!=='');
export type WebsiteBanner={id:string;title:string;image_url:string;link_url:string;placement:string;position:number;active:boolean};
export function bannersForPage<T extends WebsiteBanner>(rows:T[],page:string){return rows.filter(r=>r.active&&r.placement===page&&r.image_url).sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));}