import { describe,expect,it } from 'vitest';
import { bannerImage,bannersForPage } from './website-banners';
import { adminChangeSchema } from './admin-rules';
describe('website banner uploads',()=>{
 it('saves uploaded banner file reference without image bytes',()=>{const image='/api/public/site-file/banners/11111111-1111-4111-8111-111111111111.png';expect(bannerImage.safeParse(image).success).toBe(true);expect(adminChangeSchema.safeParse({resource:'banners',values:{image_url:image}}).success).toBe(true);expect(bannerImage.safeParse('javascript:alert(1)').success).toBe(false);});
 it('shows only active banners for the selected page in saved order',()=>{const row={id:'1',title:'Banner',image_url:'data:image/png;base64,AAAA',link_url:'',placement:'home',position:2,active:true};expect(bannersForPage([row,{...row,id:'2',position:1},{...row,id:'3',active:false},{...row,id:'4',placement:'courses'}],'home').map(r=>r.id)).toEqual(['2','1']);});
});import { bannerButtons, bannerLink } from './website-banners';
describe('home slider buttons',()=>{
 const base={id:'1',title:'Offer',image_url:'/x.png',link_url:'',placement:'home',position:1,active:true};
 const labels={know_more:'Know more',join_now:'Join Now'};
 it('shows Know more with its saved link and Join Now to sign-up by default',()=>{expect(bannerButtons({...base,know_more_url:'/courses'},labels)).toEqual([{kind:'know_more',label:'Know more',href:'/courses'},{kind:'join_now',label:'Join Now',href:'/auth?mode=signup'}]);});
 it('hides buttons the admin switched off and uses custom text',()=>{expect(bannerButtons({...base,know_more_url:'/courses',know_more_enabled:false,join_now_label:'Enroll',join_now_url:'/plans'},labels)).toEqual([{kind:'join_now',label:'Enroll',href:'/plans'}]);});
 it('hides Know more when no link is saved',()=>{expect(bannerButtons({...base,join_now_enabled:false},labels)).toEqual([]);});
 it('accepts site paths and https links only',()=>{for(const ok of ['','/courses','https://chartsikho.in/plans'])expect(bannerLink.safeParse(ok).success).toBe(true);for(const bad of ['javascript:alert(1)','//evil.com','http://x.com','courses'])expect(bannerLink.safeParse(bad).success).toBe(false);});
});
