import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, BookOpen, Video } from "lucide-react";
import hero from "@/assets/hero-bull.jpg";
import { LiveClassThumbnail, SessionDateSocial } from "@/components/site/LiveClassCard";
import { SessionPurchase } from "@/components/site/SessionPurchase";
import { EbookPurchase } from "@/components/site/EbookPurchase";
import { CloudCourseCard } from "@/components/site/CloudCourseCard";
import { inr } from "@/lib/courses";
import { useLang, type DictKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from '@tanstack/react-query';
import { catalogQuery } from '@/lib/catalog-query';
import { productQuery } from '@/lib/product-query';
import { bannerQuery } from '@/lib/banner-query';
import { WebsiteBanners } from '@/components/site/WebsiteBanners';
import { filterProducts, type ProductFilter, type ProductType } from '@/lib/product-filters';

export const Route = createFileRoute("/courses")({
  validateSearch: (s: Record<string, unknown>): { type?: ProductFilter; q?: string; cat?: string } => ({ ...(typeof s['type'] === 'string' && ['all','courses','ebooks','classes','webinars','seminars'].includes(s['type']) ? { type: s['type'] as ProductFilter } : {}), ...(typeof s['q'] === 'string' ? { q: s['q'] } : {}), ...(typeof s['cat'] === 'string' ? {cat:s['cat']} : {}) }),
  loader:({context})=>Promise.all([context.queryClient.ensureQueryData(catalogQuery()),context.queryClient.ensureQueryData(productQuery()),context.queryClient.ensureQueryData(bannerQuery())]),
  errorComponent:CatalogError,
  notFoundComponent:CatalogError,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Products & Services — Chartसीखो" },
      { name: "description", content: "Browse Chartसीखो courses, eBooks, live classes, webinars and seminars by product type." },
      { property: "og:title", content: "Products & Services — Chartसीखो" },
      { property: "og:description", content: "Browse Chartसीखो courses, eBooks, live classes, webinars and seminars by product type." },
    ],
  }),
  component: CoursesPage,
});

const filters: { key: ProductFilter; label: DictKey }[] = [
  { key: "all", label: "filter_all" },
  { key: "ebooks", label: "nav_ebooks" },
  { key: "courses", label: "nav_courses" },
  { key: "classes", label: "cat_live" },
  { key: "webinars", label: "cat_webinars" },
  { key: "seminars", label: "cat_seminars" },
];

function CoursesPage() {
  const { t } = useLang();
  const {data:cloud}=useSuspenseQuery(catalogQuery());
  const {data:products}=useSuspenseQuery(productQuery());
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const f = search.type ?? 'all';
  const q = search.q ?? '';
  const category = search.cat;
  const realCourses = filterProducts(cloud.filter(c=>!category||c.category===category).map(c=>({...c,type:'courses' as const})),f,q);
  const ebooks = filterProducts(products.ebooks.filter(()=>!category||category==='ebooks').map(b=>({...b,type:'ebooks' as const})),f,q);
  const sessions = filterProducts(products.sessions.filter(s=>!category||s.category_slug===category).map(s=>({...s,type:(s.kind==='webinar'?'webinars':s.kind==='seminar'?'seminars':'classes') as ProductType})),f,q);
  const total = realCourses.length + ebooks.length + sessions.length;
  return (
    <div className="catalog-screen w-full px-4 pt-8">
      <WebsiteBanners page="courses" fallback={
      <section className="relative overflow-hidden rounded-3xl bg-navy text-navy-foreground">
        <img src={hero} alt="" width={1280} height={832} className="absolute inset-0 h-full w-full object-cover opacity-50 md:left-1/3 md:w-2/3 md:opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-transparent" />
        <div className="relative max-w-xl p-6 sm:p-10 md:py-14">
          <span className="inline-block rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold">{t("products_hero_badge")}</span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
            {t("products_hero_title")}
          </h1>
          <p className="mt-3 opacity-85">{t("products_hero_sub")}</p>
        </div>
      </section>
      }/>
      <div className="catalog-controls mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input aria-label={t("search")} value={q} onChange={(e) => navigate({search:prev=>({...prev,q:e.target.value}),replace:true})} placeholder={t("search")} className="w-full rounded-full border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <div className="catalog-tabs flex flex-wrap gap-2">
          {filters.map((x) => (
            <Button variant={f === x.key ? "default" : "secondary"} aria-pressed={f === x.key} key={x.key} onClick={() => navigate({search:prev=>({...(prev.q ? {q:prev.q} : {}),type:x.key})})} className="rounded-full">
              {t(x.label)}
            </Button>
          ))}
        </div>
      </div>
      <div className="catalog-list mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {realCourses.map(c=><CloudCourseCard key={c.id} course={c}/>)}
        {ebooks.map(b=><article key={b.id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card"><div className="grid aspect-video place-items-center bg-muted">{b.cover_url?<img src={b.cover_url} alt={b.title} className="h-full w-full object-contain"/>:<BookOpen className="h-12 w-12 text-primary"/>}</div><div className="flex flex-1 flex-col gap-3 p-4"><p className="text-xs text-muted-foreground">{t('nav_ebooks')}</p><h2 className="font-semibold">{b.title}</h2><p className="line-clamp-2 text-sm text-muted-foreground">{b.description}</p><EbookPurchase book={b}/></div></article>)}
        {sessions.map(s=><article key={s.id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card"><LiveClassThumbnail title={s.title} thumbnailUrl={s.thumbnail_url}/><div className="flex flex-1 flex-col gap-3 p-4"><p className="text-xs text-muted-foreground">{t(s.type==='webinars'?'cat_webinars':s.type==='seminars'?'cat_seminars':'cat_live')}</p><h2 className="font-semibold"><Link to="/live/$classId" params={{classId:s.id}} className="hover:text-primary hover:underline">{s.title}</Link></h2><SessionDateSocial session={s}/><SessionPurchase session={s}/></div></article>)}
      </div>
      {total === 0 && <p className="mt-10 text-center text-muted-foreground">{t("no_results")}</p>}
    </div>
  );
}
function CatalogError(){const {t}=useLang();return <p className="p-8">{t('admin_error')}</p>;}
