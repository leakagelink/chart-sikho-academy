import { describe,expect,it } from 'vitest';
import { bannerImage,bannersForPage } from './website-banners';
import { adminChangeSchema } from './admin-rules';
describe('website banner uploads',()=>{
 it('saves uploaded banner file reference without image bytes',()=>{const image='/api/public/site-file/banners/11111111-1111-4111-8111-111111111111.png';expect(bannerImage.safeParse(image).success).toBe(true);expect(adminChangeSchema.safeParse({resource:'banners',values:{image_url:image}}).success).toBe(true);expect(bannerImage.safeParse('javascript:alert(1)').success).toBe(false);});
 it('shows only active banners for the selected page in saved order',()=>{const row={id:'1',title:'Banner',image_url:'data:image/png;base64,AAAA',link_url:'',placement:'home',position:2,active:true};expect(bannersForPage([row,{...row,id:'2',position:1},{...row,id:'3',active:false},{...row,id:'4',placement:'courses'}],'home').map(r=>r.id)).toEqual(['2','1']);});
});