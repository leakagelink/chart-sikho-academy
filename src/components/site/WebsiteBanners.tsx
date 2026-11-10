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

/** One slide's artwork, text and buttons; also used as the admin live preview. */
export function BannerSlide({banner,eager=false}:{banner:WebsiteBanner;eager?:boolean}){
 const {t}=useLang();const router=useRouter();
 const buttons=bannerButtons(banner,{know_more:t('banner_know_more'),join_now:t('banner_join_now')});
 const showText=banner.show_text!==false;
 const go=(href:string)=>(e:MouseEvent<HTMLAnchorElement>)=>{if(!href.startsWith('/')||e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0)return;e.preventDefault();router.history.push(href);};
 return <div className="banner-slide relative h-full w-full overflow-hidden bg-navy text-navy-foreground">
  {banner.image_url&&<img src={banner.image_url} alt={showText?'':banner.title} loading={eager?'eager':'lazy'} decoding="async" {...(eager?{fetchPriority:'high' as const}:{})} className="absolute inset-0 h-full w-full object-cover"/>}
  {(showText||buttons.length>0)&&<div className={`absolute inset-0 ${showText?'bg-gradient-to-r from-navy/90 via-navy/55 to-transparent':'bg-gradient-to-t from-navy/70 via-transparent to-transparent'}`}/>}
  <div className={`relative flex h-full flex-col ${showText?'justify-center':'justify-end'} gap-3 p-5 pb-10 sm:max-w-3xl sm:px-20 sm:py-10 sm:pb-12`}>
   {showText&&<><h2 className="font-display text-2xl font-bold leading-tight sm:text-4xl lg:text-5xl">{banner.title}</h2>{banner.subtitle&&<p className="line-clamp-3 max-w-xl text-sm opacity-90 sm:text-lg">{banner.subtitle}</p>}</>}
   {buttons.length>0&&<div className="mt-1 flex flex-wrap gap-3">{buttons.map(b=>{const external=!b.href.startsWith('/');return <a key={b.kind} href={b.href} onClick={go(b.href)} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})} className={b.kind==='join_now'?'inline-flex items-center rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy shadow-card transition hover:bg-gold/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring sm:px-6 sm:py-3 sm:text-base':'inline-flex items-center rounded-full border border-navy-foreground/70 bg-navy/30 px-5 py-2.5 text-sm font-semibold text-navy-foreground backdrop-blur transition hover:bg-navy-foreground/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring sm:px-6 sm:py-3 sm:text-base'}>{b.label}</a>;})}</div>}
  </div>
 </div>;
}

function BannerSlider({banners}:{banners:WebsiteBanner[]}){
 const {t}=useLang();
 const [index,setIndex]=useState(0);const [paused,setPaused]=useState(false);
 const touch=useRef<number|null>(null);
 const count=banners.length;const current=Math.min(index,count-1);
 const goTo=useCallback((i:number)=>setIndex(((i%count)+count)%count),[count]);
 useEffect(()=>{if(count<2||paused||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const id=window.setInterval(()=>setIndex(i=>(i+1)%count),AUTOPLAY_MS);return()=>window.clearInterval(id);},[count,paused]);
 useEffect(()=>{const onVis=()=>setPaused(document.hidden);document.addEventListener('visibilitychange',onVis);return()=>document.removeEventListener('visibilitychange',onVis);},[]);
 return <section aria-roledescription="carousel" aria-label={t('banner_slider_label')} className="home-banner-slider relative mt-6 overflow-hidden rounded-3xl shadow-card"
  onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}
  onTouchStart={e=>{touch.current=e.touches[0]?.clientX??null;setPaused(true);}} onTouchEnd={e=>{const start=touch.current;touch.current=null;setPaused(false);const end=e.changedTouches[0]?.clientX;if(start==null||end==null)return;const d=end-start;if(Math.abs(d)>40)goTo(current+(d<0?1:-1));}}
  onKeyDown={e=>{if(e.key==='ArrowLeft')goTo(current-1);if(e.key==='ArrowRight')goTo(current+1);}}>
  <div className="banner-track flex aspect-[4/3] w-full transition-transform duration-500 ease-out motion-reduce:transition-none sm:aspect-[16/7] lg:aspect-[12/5]" style={{transform:`translateX(-${current*100}%)`}}>
   {banners.map((b,i)=><div key={b.id} role="group" aria-roledescription="slide" aria-label={`${i+1} / ${count}`} aria-hidden={i!==current} inert={i!==current} className="h-full w-full shrink-0"><BannerSlide banner={b} eager={i===0}/></div>)}
  </div>
  {count>1&&<>
   <button type="button" onClick={()=>goTo(current-1)} aria-label={t('banner_prev')} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-navy/60 text-navy-foreground backdrop-blur transition hover:bg-navy/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring sm:grid"><ChevronLeft className="h-5 w-5"/></button>
   <button type="button" onClick={()=>goTo(current+1)} aria-label={t('banner_next')} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-navy/60 text-navy-foreground backdrop-blur transition hover:bg-navy/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring sm:grid"><ChevronRight className="h-5 w-5"/></button>
   <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">{banners.map((b,i)=><button key={b.id} type="button" onClick={()=>goTo(i)} aria-label={`${t('banner_go_to')} ${i+1}`} aria-current={i===current} className={`h-2.5 rounded-full transition-all ${i===current?'w-7 bg-gold':'w-2.5 bg-navy-foreground/60 hover:bg-navy-foreground'}`}/>)}</div>
  </>}
 </section>;
}
