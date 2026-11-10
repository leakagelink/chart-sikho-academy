import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { bannerQuery } from '@/lib/banner-query';
import { bannerButtons, bannersForPage, type WebsiteBanner } from '@/lib/website-banners';
import { useLang } from '@/lib/i18n';

const AUTOPLAY_MS = 6000;

export function WebsiteBanners({page,fallback}:{page:'home'|'courses'|'dashboard';fallback?:React.ReactNode}){
 const {data}=useSuspenseQuery(bannerQuery());const banners=bannersForPage(data,page);
 if(!banners.length)return <>{fallback}</>;
 return <BannerSlider banners={banners}/>;
}

const BTN_JOIN='inline-flex items-center rounded-full bg-gold px-5 py-2 text-sm font-semibold text-navy shadow-card transition hover:bg-gold/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring sm:px-6 sm:py-2.5 sm:text-base';
const BTN_MORE='inline-flex items-center rounded-full border border-navy-foreground/70 px-5 py-2 text-sm font-semibold text-navy-foreground transition hover:bg-navy-foreground/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring sm:px-6 sm:py-2.5 sm:text-base';

/** Full, uncropped artwork with no overlay; a blurred copy fills any side space. */
function BannerImage({banner,eager=false}:{banner:WebsiteBanner;eager?:boolean}){
 const showText=banner.show_text!==false;
 return <div className="banner-image relative aspect-[3/1] w-full overflow-hidden bg-navy">
  {banner.image_url&&<>
   <img src={banner.image_url} alt={showText?'':banner.title} loading={eager?'eager':'lazy'} decoding="async" {...(eager?{fetchPriority:'high' as const}:{})} className="relative h-full w-full object-cover"/>
  </>}
 </div>;
}

/** Title and buttons: overlaid at the bottom-right of the artwork on tablet/desktop, a strip below it on phones. */
function BannerCaption({banner,overlay=false}:{banner:WebsiteBanner;overlay?:boolean}){
 const {t}=useLang();const router=useRouter();
 const buttons=bannerButtons(banner,{know_more:t('banner_know_more'),join_now:t('banner_join_now')});
 const showText=banner.show_text!==false&&!!banner.title;
 if(!showText&&!buttons.length)return null;
 const go=(href:string)=>(e:MouseEvent<HTMLAnchorElement>)=>{if(!href.startsWith('/')||e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0)return;e.preventDefault();router.history.push(href);};
 const links=buttons.map(b=>{const external=!b.href.startsWith('/');return <a key={b.kind} href={b.href} onClick={go(b.href)} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})} className={b.kind==='join_now'?BTN_JOIN:BTN_MORE}>{b.label}</a>;});
 if(overlay)return <div className="banner-overlay pointer-events-none absolute bottom-[6%] right-[3%] z-10 hidden max-w-[60%] sm:block">
  <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-navy/75 py-2 pl-5 pr-2 text-navy-foreground shadow-card backdrop-blur-sm lg:gap-4">
   {showText&&<p className="min-w-0 truncate font-display text-base font-bold text-gold lg:text-xl" title={banner.subtitle||banner.title}>{banner.title}</p>}
   {buttons.length>0&&<div className="flex shrink-0 gap-2 lg:gap-3">{links}</div>}
  </div>
 </div>;
 return <div className={`banner-caption flex flex-col gap-3 bg-navy px-4 py-3 text-navy-foreground sm:hidden ${showText?'':'items-center'}`}>
  {showText&&<div className="min-w-0"><h2 className="font-display text-lg font-bold leading-tight text-gold">{banner.title}</h2>{banner.subtitle&&<p className="line-clamp-2 text-sm opacity-90">{banner.subtitle}</p>}</div>}
  {buttons.length>0&&<div className="flex shrink-0 flex-wrap gap-3">{links}</div>}
 </div>;
}

/** One slide's artwork with its caption strip; also used as the admin live preview. */
export function BannerSlide({banner,eager=false}:{banner:WebsiteBanner;eager?:boolean}){
 return <div className="banner-slide w-full overflow-hidden bg-navy"><div className="relative"><BannerImage banner={banner} eager={eager}/><BannerCaption banner={banner} overlay/></div><BannerCaption banner={banner}/></div>;
}

function BannerSlider({banners}:{banners:WebsiteBanner[]}){
 const {t}=useLang();
 const [index,setIndex]=useState(0);const [paused,setPaused]=useState(false);
 const touch=useRef<number|null>(null);
 const count=banners.length;const current=Math.min(index,count-1);
 const goTo=useCallback((i:number)=>setIndex(((i%count)+count)%count),[count]);
 useEffect(()=>{if(count<2||paused||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const id=window.setInterval(()=>setIndex(i=>(i+1)%count),AUTOPLAY_MS);return()=>window.clearInterval(id);},[count,paused]);
 useEffect(()=>{const onVis=()=>setPaused(document.hidden);document.addEventListener('visibilitychange',onVis);return()=>document.removeEventListener('visibilitychange',onVis);},[]);
 return <section aria-roledescription="carousel" aria-label={t('banner_slider_label')} className="home-banner-slider relative mt-6 overflow-hidden rounded-3xl bg-navy shadow-card"
  onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}
  onTouchStart={e=>{touch.current=e.touches[0]?.clientX??null;setPaused(true);}} onTouchEnd={e=>{const start=touch.current;touch.current=null;setPaused(false);const end=e.changedTouches[0]?.clientX;if(start==null||end==null)return;const d=end-start;if(Math.abs(d)>40)goTo(current+(d<0?1:-1));}}
  onKeyDown={e=>{if(e.key==='ArrowLeft')goTo(current-1);if(e.key==='ArrowRight')goTo(current+1);}}>
  <div className="relative overflow-hidden">
   <div className="banner-track flex w-full transition-transform duration-500 ease-out motion-reduce:transition-none" style={{transform:`translateX(-${current*100}%)`}}>
    {banners.map((b,i)=><div key={b.id} role="group" aria-roledescription="slide" aria-label={`${i+1} / ${count}`} aria-hidden={i!==current} inert={i!==current} className="relative w-full shrink-0"><BannerImage banner={b} eager={i===0}/><BannerCaption banner={b} overlay/></div>)}
   </div>
   {count>1&&<>
    <button type="button" onClick={()=>goTo(current-1)} aria-label={t('banner_prev')} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-navy/60 text-navy-foreground backdrop-blur transition hover:bg-navy/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring sm:grid"><ChevronLeft className="h-5 w-5"/></button>
    <button type="button" onClick={()=>goTo(current+1)} aria-label={t('banner_next')} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-navy/60 text-navy-foreground backdrop-blur transition hover:bg-navy/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring sm:grid"><ChevronRight className="h-5 w-5"/></button>
    <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1.5">{banners.map((b,i)=><button key={b.id} type="button" onClick={()=>goTo(i)} aria-label={`${t('banner_go_to')} ${i+1}`} aria-current={i===current} className="grid h-6 min-h-0 place-items-center px-0.5"><span className={`block h-2 rounded-full shadow transition-all ${i===current?'w-6 bg-gold':'w-2 bg-navy-foreground/70 hover:bg-navy-foreground'}`}/></button>)}</div>
   </>}
  </div>
  {banners[current]&&<BannerCaption banner={banners[current]}/>}
 </section>;
}
