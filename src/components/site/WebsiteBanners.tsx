import { useSuspenseQuery } from '@tanstack/react-query';
import { bannerQuery } from '@/lib/banner-query';
import { bannersForPage } from '@/lib/website-banners';
export function WebsiteBanners({page,fallback}:{page:'home'|'courses'|'dashboard';fallback?:React.ReactNode}){
 const {data}=useSuspenseQuery(bannerQuery());const banners=bannersForPage(data,page);
 if(!banners.length)return <>{fallback}</>;
 return <section className="my-6 space-y-5">{banners.map(b=>{const image=<img src={b.image_url} alt={b.title} className="block h-auto w-full rounded-lg"/>;return b.link_url?<a key={b.id} href={b.link_url} className="block focus-visible:outline focus-visible:outline-ring">{image}</a>:<div key={b.id}>{image}</div>;})}</section>;
}