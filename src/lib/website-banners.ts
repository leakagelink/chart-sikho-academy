import { z } from 'zod';
import { storedImageReference } from './image-reference';
export const bannerImage=storedImageReference.refine(value=>value!=='');
/** Button link: empty, a same-site path ("/courses") or an https URL. */
export const bannerLink=z.string().trim().max(500).refine(v=>v===''||(v.startsWith('/')&&!v.startsWith('//')&&!v.includes('\\'))||/^https:\/\/[^\s/@]+(\/\S*)?$/i.test(v),'Invalid link');
export const DEFAULT_JOIN_URL='/auth?mode=signup';
export type WebsiteBanner={id:string;title:string;image_url:string;link_url:string;placement:string;position:number;active:boolean;subtitle?:string;show_text?:boolean;know_more_enabled?:boolean;know_more_label?:string;know_more_url?:string;join_now_enabled?:boolean;join_now_label?:string;join_now_url?:string};
export type BannerButton={kind:'know_more'|'join_now';label:string;href:string};
export function bannersForPage<T extends WebsiteBanner>(rows:T[],page:string){return rows.filter(r=>r.active&&r.placement===page&&r.image_url).sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));}
/** Buttons a slide shows: Know more needs a link (falls back to the old image link); Join Now defaults to sign-up. */
export function bannerButtons(b:WebsiteBanner,labels:{know_more:string;join_now:string}):BannerButton[]{
 const out:BannerButton[]=[];
 const know=(b.know_more_url||b.link_url||'').trim();
 if(b.know_more_enabled!==false&&know)out.push({kind:'know_more',label:b.know_more_label?.trim()||labels.know_more,href:know});
 if(b.join_now_enabled!==false)out.push({kind:'join_now',label:b.join_now_label?.trim()||labels.join_now,href:(b.join_now_url||'').trim()||DEFAULT_JOIN_URL});
 return out;
}
