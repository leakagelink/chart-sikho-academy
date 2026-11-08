import { describe,expect,it } from 'vitest';
import { bannerImage,bannersForPage } from './website-banners';
import { adminChangeSchema } from './admin-rules';
describe('website banner uploads',()=>{
 it('saves uploaded banner image instead of requiring a URL',()=>{const image='data:image/png;base64,'+'A'.repeat(3000);expect(bannerImage.safeParse(image).success).toBe(true);expect(adminChangeSchema.safeParse({resource:'banners',values:{image_url:image}}).success).toBe(true);expect(bannerImage.safeParse('javascript:alert(1)').success).toBe(false);});
 it('shows only active banners for the selected page in saved order',()=>{const row={id:'1',title:'Banner',image_url:'data:image/png;base64,AAAA',link_url:'',placement:'home',position:2,active:true};expect(bannersForPage([row,{...row,id:'2',position:1},{...row,id:'3',active:false},{...row,id:'4',placement:'courses'}],'home').map(r=>r.id)).toEqual(['2','1']);});
});